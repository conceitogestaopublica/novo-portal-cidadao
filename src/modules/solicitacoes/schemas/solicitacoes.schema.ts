import { z } from "zod";

export const criarSolicitacaoSchema = z.object({
  servicoSlug: z.string().min(1),
  mensagem: z.string().max(4000).optional().or(z.literal("")),
  contato: z.string().max(200).optional().or(z.literal("")),
});
export type CriarSolicitacaoInput = z.infer<typeof criarSolicitacaoSchema>;

export const responderSolicitacaoSchema = z.object({
  texto: z.string().min(1, "Escreva sua resposta.").max(4000),
});
export type ResponderSolicitacaoInput = z.infer<typeof responderSolicitacaoSchema>;
