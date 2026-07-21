import { z } from "zod";

export const escriturarItemFormSchema = z.object({
  itemServicoId: z.string().min(1, "Selecione o serviço."),
  base: z
    .string()
    .min(1, "Informe o valor do serviço.")
    .refine((v) => Number(v.replace(",", ".")) > 0, "O valor deve ser maior que zero."),
  retido: z.boolean().default(false),
  tomadorDoc: z.string().default(""),
});
export type EscriturarItemFormInput = z.input<typeof escriturarItemFormSchema>;
export type EscriturarItemFormOutput = z.output<typeof escriturarItemFormSchema>;
