import { z } from "zod";

export const cadastroSchema = z.object({
  documento: z.string().min(11, "Informe um CPF ou CNPJ válido."),
  nome: z.string().min(3, "Informe o nome completo."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  /**
   * "Sou prestador de fora e prestei serviço no município." Quem não é do
   * município não existe no cadastro, e sem isto ficaria trancado: precisaria
   * que um tomador declarasse por ele antes de conseguir se cadastrar.
   */
  prestadorExterno: z.boolean().optional(),
});
export type CadastroInput = z.infer<typeof cadastroSchema>;

/** Só o formulário pede confirmação de senha — a API não precisa do campo duplicado. */
export const cadastroFormSchema = cadastroSchema
  .extend({ senha2: z.string() })
  .refine((v) => v.senha === v.senha2, { message: "As senhas não conferem.", path: ["senha2"] });
export type CadastroFormInput = z.infer<typeof cadastroFormSchema>;

export const loginSenhaSchema = z.object({
  documento: z.string().min(11, "Informe um CPF ou CNPJ válido."),
  senha: z.string().min(1, "Informe sua senha."),
});
export type LoginSenhaInput = z.infer<typeof loginSenhaSchema>;

export const loginStartSchema = z.object({
  documento: z.string().min(11, "Informe um CPF ou CNPJ válido."),
});
export type LoginStartInput = z.infer<typeof loginStartSchema>;

export const loginVerifySchema = z.object({
  challengeId: z.string().min(1),
  otp: z.string().min(4).max(8, "Código inválido."),
});
export type LoginVerifyInput = z.infer<typeof loginVerifySchema>;

export const recuperarSchema = z.object({
  documento: z.string().min(11, "Informe um CPF ou CNPJ válido."),
});
export type RecuperarInput = z.infer<typeof recuperarSchema>;

export const redefinirSchema = z.object({
  token: z.string().min(10),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});
export type RedefinirInput = z.infer<typeof redefinirSchema>;

export const redefinirFormSchema = redefinirSchema
  .extend({ senha2: z.string() })
  .refine((v) => v.senha === v.senha2, { message: "As senhas não conferem.", path: ["senha2"] });
export type RedefinirFormInput = z.infer<typeof redefinirFormSchema>;
