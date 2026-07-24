import { z } from "zod";

export const enviarDesifFormSchema = z.object({
  conteudo: z.string().min(1, "Selecione um arquivo ou cole o conteúdo do leiaute ABRASF."),
  nomeArquivo: z.string().default("desif.txt"),
});
export type EnviarDesifFormInput = z.input<typeof enviarDesifFormSchema>;
export type EnviarDesifFormOutput = z.output<typeof enviarDesifFormSchema>;

export const encerrarDesifFormSchema = z.object({
  dataVencimento: z.string().min(1, "Informe o vencimento da guia."),
});
export type EncerrarDesifFormInput = z.input<typeof encerrarDesifFormSchema>;
export type EncerrarDesifFormOutput = z.output<typeof encerrarDesifFormSchema>;
