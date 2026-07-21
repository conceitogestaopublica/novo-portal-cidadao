import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/shared/lib/prisma";

/**
 * Recuperação de senha do portal — vale para QUALQUER usuário, não só o
 * prestador de fora.
 *
 * Vive no banco, e não em memória como o OTP: o link é clicado minutos (ou
 * horas) depois, e um restart do processo não pode invalidar a recuperação de
 * quem já recebeu o e-mail.
 */

/** Uma hora: tempo de sobra para abrir o e-mail, curto para um link vazado. */
const VALIDADE_MS = 60 * 60 * 1000;

/**
 * O banco guarda o HASH, nunca o token. Se o banco vazar, os links não são
 * utilizáveis — mesma razão de não guardar senha em texto.
 */
function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function criarTokenReset(contaId: string): Promise<string> {
  // Quem pede de novo invalida o pedido anterior: dois links vivos para a mesma
  // conta é superfície de ataque sem ganho nenhum.
  await prisma.portalSenhaReset.updateMany({
    where: { contaId, usadoEm: null },
    data: { usadoEm: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.portalSenhaReset.create({
    data: { contaId, tokenHash: hashDoToken(token), expiraEm: new Date(Date.now() + VALIDADE_MS) },
  });
  return token;
}

/** Conta do token, se ele existe, não expirou e não foi usado. */
export async function contaDoToken(token: string): Promise<string | null> {
  const reset = await prisma.portalSenhaReset.findFirst({
    where: { tokenHash: hashDoToken(token), usadoEm: null, expiraEm: { gt: new Date() } },
  });
  return reset?.contaId ?? null;
}

/** Uso único: consome o token e troca a senha na mesma transação. */
export async function consumirTokenETrocarSenha(token: string, senhaHash: string): Promise<boolean> {
  const tokenHash = hashDoToken(token);
  return prisma.$transaction(async (tx) => {
    const reset = await tx.portalSenhaReset.findFirst({ where: { tokenHash } });
    if (!reset) return false;

    // O UPDATE condicional (por id + usadoEm ainda nulo) é a trava: sob a mesma
    // transação, dois cliques concorrentes só deixam um passar — o segundo
    // reavalia a condição depois de esperar o lock da linha soltar e vê 0 linhas.
    const atualizado = await tx.portalSenhaReset.updateMany({
      where: { id: reset.id, usadoEm: null, expiraEm: { gt: new Date() } },
      data: { usadoEm: new Date() },
    });
    if (atualizado.count === 0) return false;

    await tx.portalConta.update({ where: { id: reset.contaId }, data: { senhaHash } });
    return true;
  });
}
