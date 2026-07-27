import { z } from "zod";

const valorSchema = (mensagemVazio: string) =>
  z
    .string()
    .min(1, mensagemVazio)
    .refine((v) => Number.isFinite(Number(v.replace(",", "."))), "Valor inválido.");

export const declararPresteiFormSchema = z.object({
  tomadorDocumento: z
    .string()
    .min(1, "Informe o CPF/CNPJ de quem contratou.")
    .refine((v) => v.replace(/\D/g, "").length >= 11, "CPF/CNPJ inválido."),
  tomadorNome: z.string().default(""),
  numeroNota: z.string().min(1, "Informe o número da nota."),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, "Competência inválida (use AAAA-MM)."),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de emissão."),
  discriminacao: z.string().default(""),
  valorServicos: valorSchema("Informe o valor do serviço.").refine(
    (v) => Number(v.replace(",", ".")) > 0,
    "O valor deve ser maior que zero.",
  ),
  valorIss: valorSchema("Informe o ISS da nota."),
});
export type DeclararPresteiFormInput = z.input<typeof declararPresteiFormSchema>;
export type DeclararPresteiFormOutput = z.output<typeof declararPresteiFormSchema>;
