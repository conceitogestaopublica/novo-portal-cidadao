import "server-only";
import argon2 from "argon2";
import type { PortalConta } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

/** Conta registrada do portal (documento + senha), vinculada ao contribuinte. */
export interface Conta {
  id: string;
  documento: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  senhaHash: string | null;
  contribuinteId: string | null;
  municipio: string;
  /** Incrementa ao trocar senha — sessão com versão antiga é tratada como revogada. */
  tokenVersion: number;
}

function map(c: PortalConta): Conta {
  return {
    id: c.id,
    documento: c.documento,
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    senhaHash: c.senhaHash,
    contribuinteId: c.contribuinteId,
    municipio: c.municipio,
    tokenVersion: c.tokenVersion,
  };
}

export async function contaByDocumento(documento: string, municipio: string): Promise<Conta | null> {
  const c = await prisma.portalConta.findUnique({ where: { documento_municipio: { documento, municipio } } });
  return c ? map(c) : null;
}

export async function criarConta(input: {
  documento: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  senha: string;
  contribuinteId: string | null;
  municipio: string;
}): Promise<Conta> {
  const senhaHash = await argon2.hash(input.senha);
  const c = await prisma.portalConta.create({
    data: {
      documento: input.documento,
      nome: input.nome,
      email: input.email ?? null,
      telefone: input.telefone ?? null,
      senhaHash,
      contribuinteId: input.contribuinteId,
      municipio: input.municipio,
    },
  });
  return map(c);
}

export async function verificarSenha(conta: Conta, senha: string): Promise<boolean> {
  if (!conta.senhaHash) return false;
  return argon2.verify(conta.senhaHash, senha);
}

/** Só a versão vigente — usado a cada renovação de token (`ensureToken`), sem buscar a linha inteira. */
export async function tokenVersionAtual(contaId: string): Promise<number | null> {
  const c = await prisma.portalConta.findUnique({ where: { id: contaId }, select: { tokenVersion: true } });
  return c?.tokenVersion ?? null;
}
