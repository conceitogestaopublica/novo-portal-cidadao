import "server-only";
import { prisma } from "@/shared/lib/prisma";

/**
 * Lockout de login por chave (admin: IP; login por senha do cidadão: documento)
 * — bloqueia após `MAX_TENTATIVAS` falhas seguidas. Persistido em
 * `PortalLoginTentativa` (substitui o antigo `Map` em memória): sobrevive a
 * restart/deploy e vale entre instâncias do portal.
 */
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000;

export type EscopoLogin = "admin" | "login-senha";

/** True se a chave está bloqueada agora. */
export async function loginBloqueado(escopo: EscopoLogin, chave: string): Promise<boolean> {
  const t = await prisma.portalLoginTentativa.findUnique({ where: { escopo_chave: { escopo, chave } } });
  if (!t?.bloqueadoAte) return false;
  if (t.bloqueadoAte.getTime() < Date.now()) {
    await prisma.portalLoginTentativa.delete({ where: { escopo_chave: { escopo, chave } } });
    return false;
  }
  return true;
}

/** Registra uma tentativa malsucedida; bloqueia ao atingir o limite. */
export async function registrarFalha(escopo: EscopoLogin, chave: string): Promise<void> {
  const t = await prisma.portalLoginTentativa.findUnique({ where: { escopo_chave: { escopo, chave } } });
  const contagem = (t?.contagem ?? 0) + 1;
  const bloqueadoAte = contagem >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MS) : (t?.bloqueadoAte ?? null);
  await prisma.portalLoginTentativa.upsert({
    where: { escopo_chave: { escopo, chave } },
    create: { escopo, chave, contagem, bloqueadoAte },
    update: { contagem, bloqueadoAte },
  });
}

/** Login bem-sucedido — zera o contador de falhas. */
export async function registrarSucesso(escopo: EscopoLogin, chave: string): Promise<void> {
  await prisma.portalLoginTentativa.deleteMany({ where: { escopo, chave } });
}
