import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { getByIdDaConta } from "@/shared/repos/solicitacao-repo";
import { protocoloConfigDe, responderProtocoloGpe2 } from "@/shared/adapters/gpe2.adapter";
import { responderSolicitacaoSchema as schema } from "@/modules/solicitacoes/schemas/solicitacoes.schema";
import { INDISPONIVEL } from "@/shared/lib/mensagens";

/**
 * O cidadão responde a uma exigência ("pedir mais informações") do protocolo.
 * Escopado à sua conta (posse); encaminha a resposta ao gpe2 (Modelo A).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  if (!cidadao) return NextResponse.json({ message: "Entre para responder." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Escreva sua resposta." }, { status: 400 });

  const s = await getByIdDaConta(id, cidadao.id, tenant.municipio);
  if (!s) return NextResponse.json({ message: "Solicitação não encontrada." }, { status: 404 });

  const cfg = protocoloConfigDe(tenant);
  if (!cfg || !s.protocoloId) {
    return NextResponse.json({ message: "Esta solicitação ainda não tem protocolo para responder." }, { status: 409 });
  }

  try {
    const r = await responderProtocoloGpe2(cfg, { origemRef: s.protocolo, texto: parsed.data.texto });
    if (!r.ok) return NextResponse.json({ message: r.mensagem ?? "Não foi possível registrar a resposta." }, { status: 422 });
  } catch {
    return NextResponse.json({ message: INDISPONIVEL.responder }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
