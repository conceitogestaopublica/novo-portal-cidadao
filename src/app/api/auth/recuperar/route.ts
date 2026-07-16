import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { contaByDocumento } from "@/shared/repos/conta-repo";
import { criarTokenReset } from "@/shared/repos/senha-reset-repo";
import { enviarEmail, emailHabilitado } from "@/shared/lib/email-sender";

const schema = z.object({ documento: z.string().min(11) });

/**
 * Passo 1 da recuperação de senha (qualquer usuário do portal).
 *
 * ANTI-ENUMERAÇÃO: a resposta é sempre a mesma, exista a conta ou não, tenha
 * e-mail ou não. Dizer "documento não cadastrado" entregaria a quem sonda quais
 * CPF/CNPJ têm conta no município.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) {
    return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Informe o CPF/CNPJ." }, { status: 400 });
  }
  const documento = parsed.data.documento.replace(/\D/g, "");

  const conta = await contaByDocumento(documento, tenant.municipio);

  // Em dev, o link é ecoado na resposta — mesmo recurso que o OTP já usa, e a
  // única forma de testar enquanto o município não configurou o SMTP.
  const devEcho = process.env.DEV_OTP_ECHO === "true";
  let devLink: string | undefined;

  if (conta?.email) {
    const token = await criarTokenReset(conta.id);
    const url = new URL(`/redefinir?token=${token}`, req.url).toString();
    if (devEcho) devLink = url;

    await enviarEmail({
      para: conta.email,
      assunto: "Recuperação de senha — Portal do Cidadão",
      texto:
        `Olá, ${conta.nome}.\n\n` +
        `Recebemos um pedido para redefinir a senha da sua conta no Portal do Cidadão.\n\n` +
        `Abra este link para criar uma nova senha (vale por 1 hora):\n${url}\n\n` +
        `Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.`,
    });
  }

  return NextResponse.json({
    ok: true,
    // Não diz se a conta existe nem se tem e-mail.
    message: "Se houver uma conta com este documento e e-mail cadastrado, enviamos o link.",
    ...(devLink ? { devLink } : {}),
    // Sinaliza ao front que o município ainda não configurou o envio, para ele
    // orientar quem não vai receber nada.
    envioConfigurado: emailHabilitado(),
  });
}
