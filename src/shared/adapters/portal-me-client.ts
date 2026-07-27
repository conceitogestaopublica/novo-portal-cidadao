import "server-only";
import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { readSession, writeSession } from "@/shared/lib/portal-session";
import { tokenVersionAtual } from "@/shared/repos/conta-repo";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";

/**
 * Cliente server-side do `portal-me` para os route handlers fiscais.
 *
 * A sessão do portal (8h) é a identidade durável; o JWT CONTRIBUINTE do
 * tributário tem TTL 15min. Se ele expirou/está ausente, o BFF **re-emite**
 * transparentemente com o `contribuinteId` da sessão (a própria sessão httpOnly
 * é a prova de identidade) — sem novo OTP.
 */
async function ensureToken(): Promise<
  | { ok: true; adapter: TributarioAdapter; token: string }
  | { ok: false; status: number }
> {
  const [tenant, session] = await Promise.all([currentTenant(), readSession()]);
  if (!tenant) return { ok: false, status: 404 };
  if (!session?.conta) return { ok: false, status: 401 };

  // Se a pessoa tem PortalConta, a sessão carrega a tokenVersion vigente no
  // login — trocar a senha incrementa a versão no banco (senha-reset-repo.ts)
  // e toda sessão aberta com a versão antiga passa a ser rejeitada aqui, sem
  // esperar o TTL de 8h. Quem entrou só por OTP sem conta não tem essa checagem
  // (nada a revogar por senha — a identidade em si já é revalidada a cada
  // emissão de token contra o tributário).
  if (session.contaId) {
    const vigente = await tokenVersionAtual(session.contaId);
    if (vigente === null || vigente !== session.contaTokenVersion) {
      return { ok: false, status: 401 };
    }
  }

  const adapter = new TributarioAdapter(tenant);
  const agora = Math.floor(Date.now() / 1000);
  let token = session.tributarioToken;
  const valido = token && session.tributarioTokenExp && session.tributarioTokenExp - 30 > agora;

  if (!valido) {
    try {
      const t = await adapter.emitirToken(session.conta.id);
      token = t.accessToken;
      await writeSession({
        ...session,
        tributarioToken: t.accessToken,
        tributarioTokenExp: agora + (t.expiresIn ?? 900),
      });
    } catch {
      return { ok: false, status: 502 };
    }
  }
  return { ok: true, adapter, token: token! };
}

/**
 * Faz um GET no `portal-me` e devolve uma NextResponse pronta. Usado pelos route
 * handlers `/api/fiscal/*`.
 */
export async function proxyPortalMe(
  path: string,
  searchParams?: URLSearchParams,
): Promise<NextResponse> {
  const t = await ensureToken();
  if (!t.ok) {
    return NextResponse.json({ message: "Sessão inválida" }, { status: t.status });
  }
  const r = await t.adapter.portalMe<unknown>(path, t.token, { searchParams });
  return NextResponse.json(r.data ?? {}, { status: r.status });
}

/**
 * Faz um POST no `portal-me` com corpo JSON e devolve a resposta como NextResponse.
 * Usado por ações fiscais (simular/aderir parcelamento).
 */
export async function proxyPortalMePost(
  path: string,
  body: unknown,
): Promise<NextResponse> {
  const t = await ensureToken();
  if (!t.ok) {
    return NextResponse.json({ message: "Sessão inválida" }, { status: t.status });
  }
  const r = await t.adapter.portalMe<unknown>(path, t.token, { method: "POST", body });
  return NextResponse.json(r.data ?? {}, { status: r.status });
}

/**
 * Faz um DELETE no `portal-me`. Usado para desfazer escrituração (item da DMS).
 */
export async function proxyPortalMeDelete(path: string): Promise<NextResponse> {
  const t = await ensureToken();
  if (!t.ok) {
    return NextResponse.json({ message: "Sessão inválida" }, { status: t.status });
  }
  const r = await t.adapter.portalMe<unknown>(path, t.token, { method: "DELETE" });
  return NextResponse.json(r.data ?? {}, { status: r.status });
}

/**
 * Faz stream de uma resposta binária do `portal-me` (ex.: PDF de 2ª via) mantendo
 * o Content-Type/Disposition do backend. Erros (409 vencida, 403 posse) voltam
 * como JSON do backend.
 */
export async function proxyPortalMeRaw(
  path: string,
  searchParams?: URLSearchParams,
): Promise<NextResponse> {
  const t = await ensureToken();
  if (!t.ok) return NextResponse.json({ message: "Sessão inválida" }, { status: t.status });
  const r = await t.adapter.portalMe<unknown>(path, t.token, { searchParams });
  const res = r.raw;
  if (!res) return NextResponse.json({ message: "Serviço indisponível" }, { status: 502 });
  const ct = res.headers.get("content-type") ?? "application/octet-stream";
  if (ct.includes("application/json")) {
    // Erro estruturado do backend (posse/vencida) — repassa o JSON e o status.
    return NextResponse.json(r.data ?? {}, { status: res.status });
  }
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: res.status,
    headers: {
      "Content-Type": ct,
      "Content-Disposition": res.headers.get("content-disposition") ?? "inline",
    },
  });
}

export { ensureToken };
