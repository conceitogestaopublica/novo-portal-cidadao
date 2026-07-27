import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
