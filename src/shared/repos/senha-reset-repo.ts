import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/shared/lib/db";

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
  await db().query(
    "UPDATE portal_senha_reset SET usado_em = now() WHERE conta_id = $1 AND usado_em IS NULL",
    [contaId],
  );

  const token = randomBytes(32).toString("hex");
  await db().query(
    "INSERT INTO portal_senha_reset (conta_id, token_hash, expira_em) VALUES ($1, $2, $3)",
    [contaId, hashDoToken(token), new Date(Date.now() + VALIDADE_MS)],
  );
  return token;
}

/** Conta do token, se ele existe, não expirou e não foi usado. */
export async function contaDoToken(token: string): Promise<string | null> {
  const { rows } = await db().query(
    `SELECT conta_id FROM portal_senha_reset
      WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > now()`,
    [hashDoToken(token)],
  );
  return (rows[0]?.conta_id as string) ?? null;
}

/** Uso único: consome o token e troca a senha na mesma transação. */
export async function consumirTokenETrocarSenha(
  token: string,
  senhaHash: string,
): Promise<boolean> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");

    // O UPDATE condicional é a trava: se dois cliques chegarem juntos, só um
    // acha o token não-usado. Sem isso o mesmo link trocaria a senha duas vezes.
    const { rows } = await client.query(
      `UPDATE portal_senha_reset SET usado_em = now()
        WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > now()
        RETURNING conta_id`,
      [hashDoToken(token)],
    );
    const contaId = rows[0]?.conta_id as string | undefined;
    if (!contaId) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query("UPDATE portal_contas SET senha_hash = $1 WHERE id = $2", [
      senhaHash,
      contaId,
    ]);
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
