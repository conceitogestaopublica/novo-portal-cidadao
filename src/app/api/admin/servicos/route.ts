import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/shared/lib/admin-session";
import { salvarServico } from "@/shared/catalogo/catalogo-admin-repo";

const schema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  slug: z.string().optional().default(""),
  categoriaSlug: z.string().min(1, "Escolha a categoria"),
  titulo: z.string().min(1, "Informe o título"),
  publico_alvo: z.enum(["cidadao", "empresa", "servidor"]).default("cidadao"),
  permite_anonimo: z.boolean().optional(),
  descricao_curta: z.string().default(""),
  descricao_completa: z.string().default(""),
  requisitos: z.string().optional(),
  documentos_necessarios: z.array(z.string()).optional(),
  prazo_entrega: z.string().default(""),
  custo: z.string().default("Gratuito"),
  orgao_responsavel: z.string().default(""),
  legislacao: z.string().optional(),
  palavras_chave: z.array(z.string()).optional(),
  icone: z.string().default("fas fa-file-lines"),
  tipo_fluxo: z.enum(["processo_ged", "self_service_fiscal", "protocolo_gpe2"]).default("processo_ged"),
  fiscal_acao: z.enum(["segunda_via", "certidao", "parcelamento", "debitos", "caixa_postal"]).nullable().optional(),
  publicado: z.boolean().default(true),
  ordem: z.number().int().optional(),
});

/** Cria/atualiza um serviço da Carta de Serviços. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { ordem, publicado, ...servico } = parsed.data;
  // Serviço fiscal exige uma ação; fora disso, zera o campo.
  const fiscal_acao = servico.tipo_fluxo === "self_service_fiscal" ? servico.fiscal_acao ?? null : null;
  await salvarServico({ ...servico, fiscal_acao, id: servico.id ?? servico.slug }, publicado, ordem);
  return NextResponse.json({ ok: true });
}
