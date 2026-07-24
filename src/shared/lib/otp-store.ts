import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/prisma";

/**
 * Store de desafios OTP — o BFF é dono do OTP (o tributário só resolve o
 * contribuinte e emite o token). Persistido em `PortalOtpDesafio` (substitui o
 * antigo `Map` em memória): sobrevive a restart/deploy e vale entre instâncias
 * do portal. Guarda o HASH do código, nunca o código em si — mesma razão de
 * `PortalSenhaReset` não guardar o token em texto.
 *
 * Em dev, o OTP é ecoado na resposta (`DEV_OTP_ECHO`); em produção, enviar
 * pelo canal do contribuinte (e-mail/SMS).
 */
const TTL_MS = 5 * 60 * 1000;
const MAX_TENTATIVAS = 5;

function gerarOtp(): string {
  // 6 dígitos. Em dev não é sigiloso; em prod usar crypto.randomInt.
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function criarDesafio(input: {
  contribuinteId: string;
  nome: string;
  documento: string;
  municipio: string;
}): Promise<{ challengeId: string; otp: string }> {
  const challengeId = crypto.randomUUID();
  const otp = gerarOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  await prisma.portalOtpDesafio.create({
    data: {
      id: challengeId,
      contribuinteId: input.contribuinteId,
      nome: input.nome,
      documento: input.documento,
      municipio: input.municipio,
      otpHash,
      expiraEm: new Date(Date.now() + TTL_MS),
    },
  });
  return { challengeId, otp };
}

export type VerificacaoResultado =
  | { ok: true; contribuinteId: string; nome: string; documento: string; municipio: string }
  | { ok: false; motivo: "expirado" | "invalido" | "bloqueado" };

export async function verificarDesafio(challengeId: string, otp: string): Promise<VerificacaoResultado> {
  const ch = await prisma.portalOtpDesafio.findUnique({ where: { id: challengeId } });
  if (!ch || ch.expiraEm.getTime() < Date.now()) {
    if (ch) await prisma.portalOtpDesafio.delete({ where: { id: challengeId } });
    return { ok: false, motivo: "expirado" };
  }
  if (ch.tentativas >= MAX_TENTATIVAS) {
    await prisma.portalOtpDesafio.delete({ where: { id: challengeId } });
    return { ok: false, motivo: "bloqueado" };
  }
  if (!(await bcrypt.compare(otp, ch.otpHash))) {
    await prisma.portalOtpDesafio.update({ where: { id: challengeId }, data: { tentativas: { increment: 1 } } });
    return { ok: false, motivo: "invalido" };
  }
  await prisma.portalOtpDesafio.delete({ where: { id: challengeId } });
  return {
    ok: true,
    contribuinteId: ch.contribuinteId,
    nome: ch.nome,
    documento: ch.documento,
    municipio: ch.municipio,
  };
}
