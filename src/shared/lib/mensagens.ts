/**
 * Mensagens de indisponibilidade dos backends externos (502).
 *
 * Por que não "Serviço indisponível. Tente novamente.": quando o backend está
 * fora do ar, tentar de novo dá o mesmo resultado. A mensagem antiga sugeria
 * que insistir resolveria — o cidadão tentava várias vezes, desistia e ficava
 * achando que o erro era dele.
 *
 * Cada mensagem diz três coisas: o que não deu certo, que a causa é do sistema
 * (não do cidadão), e o que fazer em vez de insistir.
 */
const SAIDA = "Tente mais tarde ou procure o atendimento da prefeitura.";

export const INDISPONIVEL = {
  /** Cadastro de conta — depende do tributário para validar o documento. */
  cadastro: `No momento não foi possível criar sua conta porque o sistema do município está fora do ar. ${SAIDA}`,
  /** Entrada no portal (senha ou código). */
  login: `No momento não foi possível entrar porque o sistema do município está fora do ar. ${SAIDA}`,
  /** Troca de identidade ("atuar como"). */
  atuarComo: `No momento não foi possível trocar de identidade porque o sistema do município está fora do ar. ${SAIDA}`,
  /** Envio de resposta a uma exigência do protocolo. */
  responder: `No momento não foi possível enviar sua resposta porque o sistema de protocolo está fora do ar. ${SAIDA}`,
  /** Consultas fiscais em geral (débitos, guias, certidões…). */
  fiscal: `No momento não foi possível consultar seus dados porque o sistema do município está fora do ar. ${SAIDA}`,
} as const;
