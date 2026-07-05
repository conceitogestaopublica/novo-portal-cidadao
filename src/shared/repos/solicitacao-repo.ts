import "server-only";
import { db } from "@/shared/lib/db";

/**
 * Solicitação do Portal (Lei 13.460) — espelho leve no banco do portal. A
 * tramitação real acontece no PROTOCOLO/PAE central (Modelo A = gpe2); aqui
 * guardamos o registro do cidadão + o protocolo do sistema de destino
 * (`protocoloSistema`/`protocoloId`/`protocoloNumero`) quando ele é aberto.
 */
export interface Solicitacao {
  id: string;
  protocolo: string;
  municipio: string;
  contaId: string | null;
  documento: string | null;
  nome: string;
  contato: string | null;
  servicoSlug: string;
  servicoTitulo: string;
  mensagem: string | null;
  situacao: string;
  protocoloSistema: string | null;
  protocoloId: string | null;
  protocoloNumero: string | null;
  criadoEm: string;
}

function map(r: Record<string, unknown>): Solicitacao {
  return {
    id: r.id as string,
    protocolo: r.protocolo as string,
    municipio: r.municipio as string,
    contaId: (r.conta_id as string) ?? null,
    documento: (r.documento as string) ?? null,
    nome: r.nome as string,
    contato: (r.contato as string) ?? null,
    servicoSlug: r.servico_slug as string,
    servicoTitulo: r.servico_titulo as string,
    mensagem: (r.mensagem as string) ?? null,
    situacao: r.situacao as string,
    protocoloSistema: (r.protocolo_sistema as string) ?? null,
    protocoloId: (r.protocolo_id as string) ?? null,
    protocoloNumero: (r.protocolo_numero as string) ?? null,
    criadoEm: (r.criado_em as Date)?.toISOString?.() ?? String(r.criado_em),
  };
}

/** Vincula o protocolo aberto no sistema de destino (ex.: gpe2) à solicitação. */
export async function vincularProtocolo(
  id: string,
  info: { sistema: string; protocoloId: string; numero: string },
): Promise<void> {
  await db().query(
    "UPDATE portal_solicitacoes SET protocolo_sistema=$2, protocolo_id=$3, protocolo_numero=$4, atualizado_em=now() WHERE id=$1",
    [id, info.sistema, info.protocoloId, info.numero],
  );
}

/**
 * Atualiza a situação (e protocolo, se ainda faltando) de uma solicitação a partir
 * do webhook do sistema de destino, localizando-a pelo `protocolo` (origem_ref)
 * dentro do município. Retorna quantas linhas foram afetadas.
 */
export async function atualizarPorOrigemRef(
  municipio: string,
  origemRef: string,
  info: { situacao?: string | null; protocoloId?: string | null; numero?: string | null },
): Promise<number> {
  const r = await db().query(
    `UPDATE portal_solicitacoes SET
       situacao = COALESCE($3, situacao),
       protocolo_id = COALESCE($4, protocolo_id),
       protocolo_numero = COALESCE($5, protocolo_numero),
       protocolo_sistema = COALESCE(protocolo_sistema, 'gpe2'),
       atualizado_em = now()
     WHERE municipio=$1 AND protocolo=$2`,
    [municipio, origemRef, info.situacao ?? null, info.protocoloId ?? null, info.numero ?? null],
  );
  return r.rowCount ?? 0;
}

function gerarProtocolo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `SOL${ymd}-${rnd}`;
}

export async function criarSolicitacao(input: {
  municipio: string;
  contaId: string | null;
  documento: string | null;
  nome: string;
  contato: string | null;
  servicoSlug: string;
  servicoTitulo: string;
  mensagem: string | null;
}): Promise<Solicitacao> {
  const r = await db().query(
    `INSERT INTO portal_solicitacoes
       (protocolo, municipio, conta_id, documento, nome, contato, servico_slug, servico_titulo, mensagem)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      gerarProtocolo(),
      input.municipio,
      input.contaId,
      input.documento,
      input.nome,
      input.contato,
      input.servicoSlug,
      input.servicoTitulo,
      input.mensagem,
    ],
  );
  return map(r.rows[0]);
}

/** Solicitações de uma conta (as "minhas solicitações"). */
export async function listByConta(contaId: string, municipio: string): Promise<Solicitacao[]> {
  const r = await db().query(
    "SELECT * FROM portal_solicitacoes WHERE conta_id=$1 AND municipio=$2 ORDER BY criado_em DESC",
    [contaId, municipio],
  );
  return r.rows.map(map);
}

/** Uma solicitação, escopada à conta (posse). */
export async function getByIdDaConta(id: string, contaId: string, municipio: string): Promise<Solicitacao | null> {
  const r = await db().query(
    "SELECT * FROM portal_solicitacoes WHERE id=$1 AND conta_id=$2 AND municipio=$3",
    [id, contaId, municipio],
  );
  return r.rows[0] ? map(r.rows[0]) : null;
}
