import "server-only";
import argon2 from "argon2";
import type { PortalAdmin } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

/** Conta de administrador da Carta de Serviços — uma por pessoa. */
export interface Admin {
  id: string;
  email: string;
  nome: string;
  senhaHash: string;
  municipio: string | null;
  tokenVersion: number;
  ativo: boolean;
}

function map(a: PortalAdmin): Admin {
  return {
    id: a.id,
    email: a.email,
    nome: a.nome,
    senhaHash: a.senhaHash,
    municipio: a.municipio,
    tokenVersion: a.tokenVersion,
    ativo: a.ativo,
  };
}

/** Só considera contas ativas e não excluídas — a mesma linha "desativada" nunca autentica de novo. */
export async function adminByEmail(email: string): Promise<Admin | null> {
  const a = await prisma.portalAdmin.findFirst({
    where: { email, ativo: true, deletedAt: null },
  });
  return a ? map(a) : null;
}

export async function adminById(id: string): Promise<Admin | null> {
  const a = await prisma.portalAdmin.findFirst({
    where: { id, ativo: true, deletedAt: null },
  });
  return a ? map(a) : null;
}

export async function verificarSenhaAdmin(admin: Admin, senha: string): Promise<boolean> {
  return argon2.verify(admin.senhaHash, senha);
}

export async function criarAdmin(input: {
  email: string;
  nome: string;
  senha: string;
  municipio?: string | null;
}): Promise<Admin> {
  const senhaHash = await argon2.hash(input.senha);
  const a = await prisma.portalAdmin.create({
    data: {
      email: input.email,
      nome: input.nome,
      senhaHash,
      municipio: input.municipio ?? null,
    },
  });
  return map(a);
}

/**
 * Invalida toda sessão já emitida pra este admin — qualquer cookie com
 * `tokenVersion` antigo passa a ser rejeitado na próxima checagem
 * (`getAdminSession`). Usar ao trocar senha ou desativar a conta.
 */
export async function revogarSessoesAdmin(id: string): Promise<void> {
  await prisma.portalAdmin.update({
    where: { id },
    data: { tokenVersion: { increment: 1 } },
  });
}

/** Soft delete — nunca apaga a linha (preserva a autoria de escritas passadas no catálogo). */
export async function desativarAdmin(id: string, desativadoPorId: string): Promise<void> {
  await prisma.portalAdmin.update({
    where: { id },
    data: { ativo: false, deletedAt: new Date(), deletedBy: desativadoPorId, tokenVersion: { increment: 1 } },
  });
}
