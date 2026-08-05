import "server-only";
import { IdentidadeProvedor, type PortalContaIdentidade } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

/**
 * Meios de entrada vinculados a uma conta do cidadão — ver
 * [ADR-0009](../../../docs/adr/0009-identidade-do-cidadao.md).
 *
 * A identidade é a PESSOA (`documento` + `municipio`), não a forma de provar quem
 * ela é. Por isso a busca sempre devolve a conta: dois meios diferentes que
 * apontam para o mesmo CPF chegam na mesma conta e no mesmo histórico.
 *
 * Nada aqui autentica ninguém. O gov.br e o certificado ainda não estão
 * implementados; este repositório é a base de dados que os dois vão usar.
 */

export { IdentidadeProvedor };

export interface Identidade {
  id: string;
  contaId: string;
  provedor: IdentidadeProvedor;
  sujeito: string;
  nivel: string | null;
  ultimoUsoEm: Date | null;
}

function map(i: PortalContaIdentidade): Identidade {
  return {
    id: i.id,
    contaId: i.contaId,
    provedor: i.provedor,
    sujeito: i.sujeito,
    nivel: i.nivel,
    ultimoUsoEm: i.ultimoUsoEm,
  };
}

/** Identidades já vinculadas a uma conta (para a tela "como você entra"). */
export async function identidadesDaConta(contaId: string): Promise<Identidade[]> {
  const rows = await prisma.portalContaIdentidade.findMany({
    where: { contaId },
    orderBy: { criadoEm: "asc" },
  });
  return rows.map(map);
}

/**
 * Vincula um meio de entrada a uma conta. Idempotente: repetir o mesmo
 * (provedor, sujeito) atualiza o nível em vez de estourar por chave única —
 * o selo do gov.br muda quando o cidadão eleva a conta dele.
 */
export async function vincularIdentidade(input: {
  contaId: string;
  provedor: IdentidadeProvedor;
  sujeito: string;
  nivel?: string | null;
}): Promise<Identidade> {
  const i = await prisma.portalContaIdentidade.upsert({
    where: { provedor_sujeito: { provedor: input.provedor, sujeito: input.sujeito } },
    create: {
      contaId: input.contaId,
      provedor: input.provedor,
      sujeito: input.sujeito,
      nivel: input.nivel ?? null,
    },
    update: { nivel: input.nivel ?? null },
  });
  return map(i);
}

/**
 * Acha a CONTA a partir de um meio de entrada — é o que gov.br e certificado vão
 * chamar depois de autenticar. `null` quando o meio ainda não foi vinculado a
 * ninguém (primeiro acesso: cai no fluxo de vincular a uma conta existente ou
 * criar uma nova).
 */
export async function contaPorIdentidade(provedor: IdentidadeProvedor, sujeito: string) {
  const i = await prisma.portalContaIdentidade.findUnique({
    where: { provedor_sujeito: { provedor, sujeito } },
    include: { conta: true },
  });
  return i?.conta ?? null;
}

/** Marca o uso — serve para mostrar ao cidadão qual meio ele usou por último. */
export async function registrarUso(id: string): Promise<void> {
  await prisma.portalContaIdentidade.update({
    where: { id },
    data: { ultimoUsoEm: new Date() },
  });
}

/**
 * Desvincula um meio. Recusa remover o ÚLTIMO meio de entrada da conta — sem
 * isso o cidadão consegue se trancar para fora da própria conta.
 *
 * O `FOR UPDATE` trava as linhas da conta ANTES de contar: sem ele, duas
 * chamadas concorrentes removendo dois meios diferentes da mesma conta veriam
 * `total = 2` cada uma (READ COMMITTED não protege contagem-depois-decide) e
 * as duas prosseguiriam — zerando a conta que a regra promete nunca zerar. Com
 * a trava, a segunda chamada espera a primeira comitar e reconta com o estado
 * já atualizado.
 */
export async function desvincularIdentidade(contaId: string, id: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM portal_conta_identidades WHERE conta_id = ${contaId}::uuid FOR UPDATE`;
    const total = await tx.portalContaIdentidade.count({ where: { contaId } });
    if (total <= 1) return false;
    const r = await tx.portalContaIdentidade.deleteMany({ where: { id, contaId } });
    return r.count > 0;
  });
}
