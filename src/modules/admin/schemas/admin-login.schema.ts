import { z } from "zod";

export const adminLoginSchema = z.object({
  senha: z.string().min(1, "Informe a senha do administrador."),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
