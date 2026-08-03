/**
 * Dados de quem DESENVOLVEU o portal (Conceito Gestão Pública) — fixos, iguais em
 * todo município. Não confundir com os dados da PREFEITURA, que são por tenant e
 * vêm do cadastro do GED (ver `Ug` em `shared/types/portal.ts`).
 *
 * Ficam aqui, e não no JSX do rodapé, porque são dados institucionais que mudam
 * sem que ninguém queira mexer em layout.
 */
export const EMPRESA = {
  nome: "Conceito Gestão Pública",
  produto: "GPECloud",
  endereco: "R. Paraíba, 889 — Savassi, Belo Horizonte/MG",
  cep: "30130-145",
  telefone: "(31) 99886-5398",
  /** Só dígitos, para o link do WhatsApp. */
  telefoneDigitos: "5531998865398",
  email: "adm@conceitogestaopublica.com.br",
} as const;

/**
 * Versão exibida no rodapé. Serve para encurtar chamado de suporte: dá para saber
 * qual versão o município roda sem precisar perguntar.
 *
 * Mantenha em sincronia com o `version` do `package.json`.
 */
export const APP_VERSION = "0.1.0";
