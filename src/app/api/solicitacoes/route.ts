import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { getServico } from "@/shared/catalogo/catalogo";
import { criarSolicitacao, listByConta } from "@/shared/repos/solicitacao-repo";

/** Minhas solicitações (do cidadão logado). */
export async function GET() {
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  if (!cidadao) return NextResponse.json({ message: "Sessão inválida" }, { status: 401 });
  const items = await listByConta(cidadao.id, tenant.municipio);
  return NextResponse.json({ items });
}

const schema = z.object({
  servicoSlug: z.string().min(1),
  mensagem: z.string().max(4000).optional().or(z.literal("")),
  contato: z.string().max(200).optional().or(z.literal("")),
});

/** Abrir uma solicitação (vira processo no GED — integração pendente do contrato de auth). */
export async function POST(req: Request) {
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  if (!cidadao) return NextResponse.json({ message: "Entre para abrir uma solicitação." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });

  // Serviço válido do catálogo (título vem do servidor, não do cliente).
  const data = await getServico(parsed.data.servicoSlug);
  if (!data) return NextResponse.json({ message: "Serviço não encontrado." }, { status: 404 });

  const solicitacao = await criarSolicitacao({
    municipio: tenant.municipio,
    contaId: cidadao.id,
    documento: cidadao.documento ?? null,
    nome: cidadao.nome,
    contato: parsed.data.contato || null,
    servicoSlug: data.servico.slug,
    servicoTitulo: data.servico.titulo,
    mensagem: parsed.data.mensagem || null,
  });

  // TODO(integração GED): abrir o processo no GED (AbrirProcessoDoPortalService)
  // e guardar `gedProcessoNumero`. Depende do contrato de auth/tenant do Vitor.
  return NextResponse.json({ ok: true, solicitacao });
}
