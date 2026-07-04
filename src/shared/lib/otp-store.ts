import "server-only";

/**
 * Store de desafios OTP — o BFF é dono do OTP (o tributário só resolve o
 * contribuinte e emite o token). MVP: em memória (single process de dev).
 * Produção: Redis ou tabela no banco do portal + canal de envio real
 * (e-mail/SMS). Aqui, em dev, o OTP é ecoado na resposta (DEV_OTP_ECHO).
 */
interface Challenge {
  contribuinteId: string;
  nome: string;
  documento: string;
  municipio: string;
  otp: string;
  expiresAt: number;
  tentativas: number;
}

// Ancorado no globalThis para persistir entre requests (route handlers rodam em
// contextos de módulo isolados no Next) e sobreviver ao HMR em dev.
const g = globalThis as typeof globalThis & { __portalOtp?: Map<string, Challenge> };
const CHALLENGES: Map<string, Challenge> = (g.__portalOtp ??= new Map());
const TTL_MS = 5 * 60 * 1000;
const MAX_TENTATIVAS = 5;

function gerarOtp(): string {
  // 6 dígitos. Em dev não é sigiloso; em prod usar crypto.randomInt.
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function criarDesafio(input: {
  contribuinteId: string;
  nome: string;
  documento: string;
  municipio: string;
}): { challengeId: string; otp: string } {
  const challengeId = crypto.randomUUID();
  const otp = gerarOtp();
  CHALLENGES.set(challengeId, {
    ...input,
    otp,
    expiresAt: Date.now() + TTL_MS,
    tentativas: 0,
  });
  return { challengeId, otp };
}

export type VerificacaoResultado =
  | { ok: true; contribuinteId: string; nome: string; municipio: string }
  | { ok: false; motivo: "expirado" | "invalido" | "bloqueado" };

export function verificarDesafio(challengeId: string, otp: string): VerificacaoResultado {
  const ch = CHALLENGES.get(challengeId);
  if (!ch || ch.expiresAt < Date.now()) {
    CHALLENGES.delete(challengeId);
    return { ok: false, motivo: "expirado" };
  }
  if (ch.tentativas >= MAX_TENTATIVAS) {
    CHALLENGES.delete(challengeId);
    return { ok: false, motivo: "bloqueado" };
  }
  if (ch.otp !== otp) {
    ch.tentativas += 1;
    return { ok: false, motivo: "invalido" };
  }
  CHALLENGES.delete(challengeId);
  return { ok: true, contribuinteId: ch.contribuinteId, nome: ch.nome, municipio: ch.municipio };
}
