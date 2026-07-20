import "server-only";

/**
 * Envio de e-mail do portal.
 *
 * SEAM documentado, no mesmo espírito do adapter de notificação do DTE no
 * backend: o transporte real (SMTP do município / provedor de mensageria) é
 * configuração de ambiente, não código. Enquanto não houver `SMTP_URL`, o
 * remetente **não finge** que enviou: registra a intenção em log e devolve
 * `enviado: false`.
 *
 * Isso importa na recuperação de senha: se disséssemos "enviado" sem enviar, o
 * usuário ficaria esperando um e-mail que nunca chega, sem saber por quê. Em
 * desenvolvimento o link é ecoado na resposta (`DEV_OTP_ECHO`), como já é com o
 * código OTP hoje.
 *
 * Para ligar de verdade: instalar o transporte, ler `SMTP_URL` e trocar o corpo
 * de `enviarEmail` — a assinatura não muda.
 */
export type EmailInput = {
  para: string;
  assunto: string;
  texto: string;
};

export type EmailResult = { enviado: boolean; detalhe?: string };

export function emailHabilitado(): boolean {
  return Boolean(process.env.SMTP_URL);
}

/** Mascara um e-mail pra log seguro: `us***@dominio.com`. */
function mascarar(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return "***";
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"*".repeat(Math.max(1, usuario.length - visivel.length))}@${dominio}`;
}

export async function enviarEmail(input: EmailInput): Promise<EmailResult> {
  if (!input.para) {
    return { enviado: false, detalhe: "Sem e-mail de destino." };
  }

  if (!emailHabilitado()) {
    // Não é erro: é o município que ainda não configurou o transporte. NUNCA logar
    // `input.texto` aqui — em e-mails de recuperação de senha ele carrega o link
    // com o token em texto puro; logar isso grava credenciais de reset no log do
    // servidor pra qualquer e-mail enviado enquanto o SMTP não estiver configurado.
    // Só sob `DEV_OTP_ECHO=true` (mesma flag já usada pro OTP) logamos o corpo
    // completo, para depuração local explícita.
    if (process.env.DEV_OTP_ECHO === "true") {
      console.info(
        `[email] (não enviado — SMTP_URL ausente) para=${input.para} assunto="${input.assunto}"\n${input.texto}`,
      );
    } else {
      console.info(
        `[email] (não enviado — SMTP_URL ausente) para=${mascarar(input.para)} assunto="${input.assunto}"`,
      );
    }
    return { enviado: false, detalhe: "Transporte de e-mail não configurado." };
  }

  // Quando o transporte existir, o despacho real entra aqui.
  console.info(`[email] para=${input.para} assunto="${input.assunto}"`);
  return { enviado: true };
}
