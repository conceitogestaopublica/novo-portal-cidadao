import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { TributarioAdapter, IdentidadeNaoAutorizadaError } from "@/shared/adapters/tributario.adapter";
import { readSession, writeSession } from "@/shared/lib/portal-session";
import { INDISPONIVEL } from "@/shared/lib/mensagens";

const schema = z.object({ contribuinteId: z.string().uuid() });

/**
 * Troca a identidade ATIVA da sessão ("atuar como") — pessoa ⇄ empresas que ela
 * representa — SEM novo login. O alvo tem de estar na lista `representados` da
 * própria sessão (checagem rápida, mas pode estar velha por até 8h); o
 * tributário — fonte de verdade do vínculo — revalida de novo na emissão do
 * token (`emitirToken`), então um vínculo revogado após o login é pego aqui.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });

  const alvo = (session.representados ?? []).find((r) => r.id === parsed.data.contribuinteId);
  if (!alvo) {
    // Não está entre as identidades autorizadas desta pessoa.
    return NextResponse.json({ message: "Identidade não autorizada." }, { status: 403 });
  }

  const documento = session.pessoa?.documento ?? session.conta.documento;
  if (!documento) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const adapter = new TributarioAdapter(tenant);
  let tokenRes;
  try {
    tokenRes = await adapter.emitirToken(alvo.id, documento);
  } catch (e) {
    if (e instanceof IdentidadeNaoAutorizadaError) {
      return NextResponse.json({ message: "Identidade não autorizada." }, { status: 403 });
    }
    return NextResponse.json({ message: INDISPONIVEL.atuarComo }, { status: 502 });
  }

  await writeSession({
    ...session,
    conta: { id: alvo.id, nome: alvo.nome, documento: alvo.documento ?? undefined },
    tributarioToken: tokenRes.accessToken,
    tributarioTokenExp: Math.floor(Date.now() / 1000) + (tokenRes.expiresIn ?? 900),
  });

  return NextResponse.json({ ok: true, atuandoComo: { id: alvo.id, nome: alvo.nome, tipo: alvo.tipo } });
}
