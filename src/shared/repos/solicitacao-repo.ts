import "server-only";
import { randomInt } from "crypto";
import { Prisma, type PortalSolicitacao } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

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

function map(s: PortalSolicitacao): Solicitacao {
  return {
    id: s.id,
    protocolo: s.protocolo,
    municipio: s.municipio,
    contaId: s.contaId,
    documento: s.documento,
    nome: s.nome,
    contato: s.contato,
    servicoSlug: s.servicoSlug,
    servicoTitulo: s.servicoTitulo,
    mensagem: s.mensagem,
    situacao: s.situacao,
    protocoloSistema: s.protocoloSistema,
    protocoloId: s.protocoloId,
    protocoloNumero: s.protocoloNumero,
    criadoEm: s.criadoEm.toISOString(),
  };
}

/** Vincula o protocolo aberto no sistema de destino (ex.: gpe2) à solicitação. */
export async function vincularProtocolo(
  id: string,
  info: { sistema: string; protocoloId: string; numero: string },
): Promise<void> {
  await prisma.portalSolicitacao.update({
    where: { id },
    data: {
      protocoloSistema: info.sistema,
      protocoloId: info.protocoloId,
      protocoloNumero: info.numero,
      atualizadoEm: new Date(),
    },
  });
}

/**
 * Atualiza a situação (e protocolo, se ainda faltando) de uma solicitação a partir
 * do webhook do sistema de destino, localizando-a pelo `protocolo` (origem_ref)
 * dentro do município. Retorna quantas linhas foram afetadas.
 *
 * Usa SQL cru (via `$executeRaw`, ainda client Prisma — não `pg`) porque o
 * COALESCE precisa ler o valor ATUAL da linha dentro do mesmo UPDATE atômico;
 * um find-então-update em dois passos teria uma janela de corrida entre
 * chamadas concorrentes do webhook.
 */
export async function atualizarPorOrigemRef(
  municipio: string,
  origemRef: string,
  info: { situacao?: string | null; protocoloId?: string | null; numero?: string | null },
): Promise<number> {
  return prisma.$executeRaw`
    UPDATE portal_solicitacoes SET
      situacao = COALESCE(${info.situacao ?? null}, situacao),
      protocolo_id = COALESCE(${info.protocoloId ?? null}, protocolo_id),
      protocolo_numero = COALESCE(${info.numero ?? null}, protocolo_numero),
      protocolo_sistema = COALESCE(protocolo_sistema, 'gpe2'),
      atualizado_em = now()
    WHERE municipio = ${municipio} AND protocolo = ${origemRef}
  `;
}

function gerarProtocolo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  // randomInt (node:crypto) é criptograficamente seguro, ao contrário de
  // Math.random() — e o intervalo maior (6 dígitos) reduz a chance de colisão
  // no mesmo dia/município. Ainda assim criarSolicitacao() tenta de novo em
  // caso de colisão real (constraint uq_portal_solic_protocolo).
  const rnd = randomInt(100000, 1000000);
  return `SOL${ymd}-${rnd}`;
}

const MAX_TENTATIVAS_PROTOCOLO = 3;

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
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_PROTOCOLO; tentativa++) {
    try {
      const s = await prisma.portalSolicitacao.create({
        data: {
          protocolo: gerarProtocolo(),
          municipio: input.municipio,
          contaId: input.contaId,
          documento: input.documento,
          nome: input.nome,
          contato: input.contato,
          servicoSlug: input.servicoSlug,
          servicoTitulo: input.servicoTitulo,
          mensagem: input.mensagem,
        },
      });
      return map(s);
    } catch (err) {
      const colisao = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      const ultimaTentativa = tentativa === MAX_TENTATIVAS_PROTOCOLO;
      if (!colisao || ultimaTentativa) throw err;
      // Colisão de protocolo no mesmo dia/município — gera outro e tenta de novo.
    }
  }
  // Inatingível (o loop sempre retorna ou lança), só pra satisfazer o TypeScript.
  throw new Error("Falha ao gerar protocolo único.");
}

/** Solicitações de uma conta (as "minhas solicitações"). */
export async function listByConta(contaId: string, municipio: string): Promise<Solicitacao[]> {
  const rows = await prisma.portalSolicitacao.findMany({
    where: { contaId, municipio },
    orderBy: { criadoEm: "desc" },
  });
  return rows.map(map);
}

/** Uma solicitação, escopada à conta (posse). */
export async function getByIdDaConta(id: string, contaId: string, municipio: string): Promise<Solicitacao | null> {
  const s = await prisma.portalSolicitacao.findFirst({ where: { id, contaId, municipio } });
  return s ? map(s) : null;
}
