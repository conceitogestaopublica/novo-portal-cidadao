import "server-only";

/**
 * Lockout do login do admin — mesmo padrão do `otp-store.ts` (Map ancorado no
 * globalThis, sobrevive a HMR). A senha do admin é única e global
 * (`PORTAL_ADMIN_SENHA`), então sem isso o login ficava aberto a força bruta
 * sem limite de tentativas.
 */
interface Tentativas {
  contagem: number;
  bloqueadoAte: number | null;
}

const g = globalThis as typeof globalThis & { __portalAdminLock?: Map<string, Tentativas> };
const TENTATIVAS: Map<string, Tentativas> = (g.__portalAdminLock ??= new Map());
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000;

/** True se a chave (IP do chamador, ou "global" se não identificável) está bloqueada. */
export function loginBloqueado(chave: string): boolean {
  const t = TENTATIVAS.get(chave);
  if (!t?.bloqueadoAte) return false;
  if (t.bloqueadoAte < Date.now()) {
    TENTATIVAS.delete(chave);
    return false;
  }
  return true;
}

/** Registra uma tentativa de senha errada; bloqueia ao atingir o limite. */
export function registrarFalha(chave: string): void {
  const t = TENTATIVAS.get(chave) ?? { contagem: 0, bloqueadoAte: null };
  t.contagem += 1;
  if (t.contagem >= MAX_TENTATIVAS) {
    t.bloqueadoAte = Date.now() + BLOQUEIO_MS;
  }
  TENTATIVAS.set(chave, t);
}

/** Login bem-sucedido — zera o contador de falhas. */
export function registrarSucesso(chave: string): void {
  TENTATIVAS.delete(chave);
}
