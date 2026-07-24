import { z } from "zod";

export const ambienteSchema = z.object({
  slug: z.string().optional().default(""),
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().default(""),
  icone: z.string().default("fas fa-folder-open"),
  cor: z.string().default("blue"),
  sistema: z.enum(["tributario", "ged", "gpe2"]).default("ged"),
  disponivel: z.boolean().default(true),
  ordem: z.number().int().optional(),
});
/** Tipo "cru" do formulário (campos com `.default()` ficam opcionais) — o que `useForm`/`defaultValues` esperam. */
export type AmbienteFormInput = z.input<typeof ambienteSchema>;
/** Tipo pós-parse (defaults aplicados) — o que `handleSubmit` entrega no submit. */
export type AmbienteOutput = z.output<typeof ambienteSchema>;

export const categoriaSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  slug: z.string().optional().default(""),
  ambienteSlug: z.string().min(1, "Escolha o ambiente"),
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().default(""),
  icone: z.string().default("fas fa-folder"),
  cor: z.string().default("blue"),
  ordem: z.number().int().optional(),
});
export type CategoriaFormInput = z.input<typeof categoriaSchema>;
export type CategoriaOutput = z.output<typeof categoriaSchema>;

export const servicoSchema = z.object({
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
  fiscal_acao: z
    .enum(["segunda_via", "certidao", "parcelamento", "debitos", "caixa_postal", "nfse", "dms", "prestei", "desif"])
    .nullable()
    .optional(),
  publicado: z.boolean().default(true),
  ordem: z.number().int().optional(),
});
export type ServicoInput = z.input<typeof servicoSchema>;
export type ServicoOutput = z.output<typeof servicoSchema>;

/**
 * Só o formulário lida com `palavras` como texto separado por vírgula — a API
 * espera `palavras_chave: string[]`. O componente monta o array no submit.
 */
export const servicoFormSchema = servicoSchema
  .omit({ palavras_chave: true })
  .extend({ palavras: z.string().default("") });
export type ServicoFormInput = z.input<typeof servicoFormSchema>;
export type ServicoFormOutput = z.output<typeof servicoFormSchema>;
