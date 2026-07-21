import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import {
  AMBIENTES_SEED,
  CATEGORIAS_SEED,
  SERVICOS_SEED,
  type Ambiente,
  type CategoriaSeed,
  type ServicoSeed,
} from "./catalogo-seed";

export interface CatalogoData {
  ambientes: Ambiente[];
  categorias: CategoriaSeed[];
  servicos: ServicoSeed[];
}

// Cache em memória por município (ancorado no globalThis p/ sobreviver ao HMR em
// dev). Um portal serve vários municípios (cada um com seu tributário/GED/gpe2
// próprio, resolvido por subdomínio) — o cache não pode ser um objeto único
// global, senão o catálogo de um município vaza pro outro. A carga do GED,
// quando existir, invalida a entrada do município correspondente.
const g = globalThis as typeof globalThis & { __portalCatalogo?: Map<string, CatalogoData> };

function cache(): Map<string, CatalogoData> {
  if (!g.__portalCatalogo) g.__portalCatalogo = new Map();
  return g.__portalCatalogo;
}

async function marcarAplicado(chave: string): Promise<void> {
  await prisma.portalSeedAplicado.createMany({ data: [{ chave }], skipDuplicates: true });
}

/**
 * Semeia o catálogo. A semente cresce a cada rotina nova (a DMS é um exemplo),
 * e o antigo "só semeia se o banco estiver vazio" fazia com que **nada novo
 * chegasse a quem já tinha subido o portal** — cada município precisaria de um
 * SQL na mão.
 *
 * Semear sempre também não serve: o admin **exclui** serviço de verdade
 * (`removerServico`), e um insert cego ressuscitaria o que o município tirou do ar.
 *
 * Então cada linha da semente é oferecida **uma única vez na vida do banco**, e
 * o registro dessa oferta fica em `portal_seed_aplicado`. Banco que já existe é
 * reconciliado: o que já está lá entra no registro como aplicado, e só o que é
 * genuinamente novo é inserido. Editar/excluir depois é decisão do município e
 * fica de pé.
 */
async function semearNovidades(municipio: string): Promise<void> {
  // Reconciliação (por município): o que já existe conta como semeado (não
  // reinsere, não ressuscita). A chave é prefixada pelo município — senão a
  // semente de um município marcaria a de outro como "já aplicada" sem nunca
  // ter rodado lá.
  const [ambientesExistentes, categoriasExistentes, servicosExistentes] = await Promise.all([
    prisma.portalAmbiente.findMany({ where: { municipio }, select: { slug: true } }),
    prisma.portalCategoria.findMany({ where: { municipio }, select: { slug: true } }),
    prisma.portalServico.findMany({ where: { municipio }, select: { slug: true } }),
  ]);
  await prisma.portalSeedAplicado.createMany({
    data: [
      ...ambientesExistentes.map((a) => ({ chave: `${municipio}:ambiente:${a.slug}` })),
      ...categoriasExistentes.map((c) => ({ chave: `${municipio}:categoria:${c.slug}` })),
      ...servicosExistentes.map((s) => ({ chave: `${municipio}:servico:${s.slug}` })),
    ],
    skipDuplicates: true,
  });

  const aplicadoRows = await prisma.portalSeedAplicado.findMany({
    where: { chave: { startsWith: `${municipio}:` } },
    select: { chave: true },
  });
  const aplicado = new Set(aplicadoRows.map((r) => r.chave));

  for (let i = 0; i < AMBIENTES_SEED.length; i++) {
    const a = AMBIENTES_SEED[i];
    const chave = `${municipio}:ambiente:${a.slug}`;
    if (aplicado.has(chave)) continue;
    await prisma.portalAmbiente.createMany({
      data: [{ municipio, slug: a.slug, ordem: i, dados: a as unknown as Prisma.InputJsonValue }],
      skipDuplicates: true,
    });
    await marcarAplicado(chave);
  }
  for (let i = 0; i < CATEGORIAS_SEED.length; i++) {
    const c = CATEGORIAS_SEED[i];
    const chave = `${municipio}:categoria:${c.slug}`;
    if (aplicado.has(chave)) continue;
    await prisma.portalCategoria.createMany({
      data: [
        { municipio, slug: c.slug, ambienteSlug: c.ambienteSlug, ordem: i, dados: c as unknown as Prisma.InputJsonValue },
      ],
      skipDuplicates: true,
    });
    await marcarAplicado(chave);
  }
  for (let i = 0; i < SERVICOS_SEED.length; i++) {
    const s = SERVICOS_SEED[i];
    const chave = `${municipio}:servico:${s.slug}`;
    if (aplicado.has(chave)) continue;
    await prisma.portalServico.createMany({
      data: [
        {
          municipio,
          slug: s.slug,
          categoriaSlug: s.categoriaSlug,
          publicado: true,
          ordem: i,
          dados: s as unknown as Prisma.InputJsonValue,
        },
      ],
      skipDuplicates: true,
    });
    await marcarAplicado(chave);
  }

  await aplicarCorrecoes(municipio, aplicado);
}

/**
 * Correções pontuais de dado semeado errado. Usa o mesmo registro da semente
 * (roda uma vez por banco), e cada uma é cirúrgica: só toca a linha que ainda
 * tem o valor errado, então uma correção já feita pelo município fica de pé.
 *
 * `nfse` foi semeado com `fiscal_acao: "debitos"` — a página do serviço mandava
 * o prestador para "Meus Débitos" em vez de para a emissão da nota. O
 * `jsonb_set` condicional exige SQL cru (via `$executeRaw`, client Prisma).
 */
const CORRECOES: ReadonlyArray<{ chave: string; aplicar: (municipio: string) => Promise<unknown> }> = [
  {
    chave: "fix:nfse-fiscal-acao",
    aplicar: (municipio) =>
      prisma.$executeRaw`
        UPDATE portal_servicos SET dados = jsonb_set(dados::jsonb, '{fiscal_acao}', '"nfse"')
        WHERE municipio = ${municipio} AND slug = 'nfse' AND dados->>'fiscal_acao' = 'debitos'
      `,
  },
];

async function aplicarCorrecoes(municipio: string, aplicado: Set<string>): Promise<void> {
  for (const c of CORRECOES) {
    const chave = `${municipio}:${c.chave}`;
    if (aplicado.has(chave)) continue;
    await c.aplicar(municipio);
    await marcarAplicado(chave);
  }
}

/** Invalida o cache em memória de um município — chamar após qualquer escrita no catálogo (admin/sync GED). */
export function invalidarCatalogo(municipio: string): void {
  cache().delete(municipio);
}

/** Catálogo de um município (do banco do portal). 1ª carga semeia da semente; fallback = semente. */
export async function carregarCatalogo(municipio: string): Promise<CatalogoData> {
  const cached = cache().get(municipio);
  if (cached) return cached;
  try {
    await semearNovidades(municipio);
    const [amb, cat, ser] = await Promise.all([
      prisma.portalAmbiente.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
      prisma.portalCategoria.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
      prisma.portalServico.findMany({
        where: { municipio, publicado: true },
        orderBy: [{ ordem: "asc" }, { slug: "asc" }],
      }),
    ]);
    const data: CatalogoData = {
      ambientes: amb.map((r) => r.dados as unknown as Ambiente),
      categorias: cat.map((r) => r.dados as unknown as CategoriaSeed),
      servicos: ser.map((r) => r.dados as unknown as ServicoSeed),
    };
    if (data.ambientes.length) {
      cache().set(municipio, data);
      return data;
    }
  } catch {
    // banco indisponível — usa a semente em memória (fallback seguro).
  }
  return { ambientes: AMBIENTES_SEED, categorias: CATEGORIAS_SEED, servicos: SERVICOS_SEED };
}
