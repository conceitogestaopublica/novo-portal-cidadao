import "server-only";
import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { readSession, writeSession } from "@/shared/lib/portal-session";
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

export { ensureToken };
