import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/shared/lib/db";

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
}

function map(r: Record<string, unknown>): Conta {
  return {
    id: r.id as string,
    documento: r.documento as string,
    nome: r.nome as string,
    email: (r.email as string) ?? null,
    telefone: (r.telefone as string) ?? null,
    senhaHash: (r.senha_hash as string) ?? null,
    contribuinteId: (r.contribuinte_id as string) ?? null,
    municipio: r.municipio as string,
  };
}

export async function contaByDocumento(documento: string, municipio: string): Promise<Conta | null> {
  const r = await db().query(
    "SELECT * FROM portal_contas WHERE documento=$1 AND municipio=$2",
    [documento, municipio],
  );
  return r.rows[0] ? map(r.rows[0]) : null;
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
  const senhaHash = await bcrypt.hash(input.senha, 10);
  const r = await db().query(
    `INSERT INTO portal_contas (documento, nome, email, telefone, senha_hash, contribuinte_id, municipio)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [input.documento, input.nome, input.email ?? null, input.telefone ?? null, senhaHash, input.contribuinteId, input.municipio],
  );
  return map(r.rows[0]);
}

export async function verificarSenha(conta: Conta, senha: string): Promise<boolean> {
  if (!conta.senhaHash) return false;
  return bcrypt.compare(senha, conta.senhaHash);
}
