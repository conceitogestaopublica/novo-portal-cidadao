import "server-only";
import { db } from "@/shared/lib/db";
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
  await db().query(`
    CREATE TABLE IF NOT EXISTS portal_seed_aplicado (
      chave TEXT PRIMARY KEY,
      aplicado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  // Reconciliação (por município): o que já existe conta como semeado (não
  // reinsere, não ressuscita). A chave é prefixada pelo município — senão a
  // semente de um município marcaria a de outro como "já aplicada" sem nunca
  // ter rodado lá.
  await db().query(
    `
    INSERT INTO portal_seed_aplicado (chave)
    SELECT $1 || ':ambiente:' || slug FROM portal_ambientes WHERE municipio = $1
    UNION ALL SELECT $1 || ':categoria:' || slug FROM portal_categorias WHERE municipio = $1
    UNION ALL SELECT $1 || ':servico:' || slug FROM portal_servicos WHERE municipio = $1
    ON CONFLICT (chave) DO NOTHING`,
    [municipio],
  );

  const { rows } = await db().query(
    "SELECT chave FROM portal_seed_aplicado WHERE chave LIKE $1",
    [`${municipio}:%`],
  );
  const aplicado = new Set<string>(rows.map((r: { chave: string }) => r.chave));
  const marcar = (chave: string) =>
    db().query("INSERT INTO portal_seed_aplicado (chave) VALUES ($1) ON CONFLICT DO NOTHING", [chave]);

  for (let i = 0; i < AMBIENTES_SEED.length; i++) {
    const a = AMBIENTES_SEED[i];
    const chave = `${municipio}:ambiente:${a.slug}`;
    if (aplicado.has(chave)) continue;
    await db().query("INSERT INTO portal_ambientes (municipio, slug, ordem, dados) VALUES ($1,$2,$3,$4) ON CONFLICT (municipio, slug) DO NOTHING", [municipio, a.slug, i, JSON.stringify(a)]);
    await marcar(chave);
  }
  for (let i = 0; i < CATEGORIAS_SEED.length; i++) {
    const c = CATEGORIAS_SEED[i];
    const chave = `${municipio}:categoria:${c.slug}`;
    if (aplicado.has(chave)) continue;
    await db().query("INSERT INTO portal_categorias (municipio, slug, ambiente_slug, ordem, dados) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (municipio, slug) DO NOTHING", [municipio, c.slug, c.ambienteSlug, i, JSON.stringify(c)]);
    await marcar(chave);
  }
  for (let i = 0; i < SERVICOS_SEED.length; i++) {
    const s = SERVICOS_SEED[i];
    const chave = `${municipio}:servico:${s.slug}`;
    if (aplicado.has(chave)) continue;
    await db().query("INSERT INTO portal_servicos (municipio, slug, categoria_slug, publicado, ordem, dados) VALUES ($1,$2,$3,true,$4,$5) ON CONFLICT (municipio, slug) DO NOTHING", [municipio, s.slug, s.categoriaSlug, i, JSON.stringify(s)]);
    await marcar(chave);
  }

  await aplicarCorrecoes(municipio, aplicado);
}

/**
 * Correções pontuais de dado semeado errado. Usa o mesmo registro da semente
 * (roda uma vez por banco), e cada uma é cirúrgica: só toca a linha que ainda
 * tem o valor errado, então uma correção já feita pelo município fica de pé.
 *
 * `nfse` foi semeado com `fiscal_acao: "debitos"` — a página do serviço mandava
 * o prestador para "Meus Débitos" em vez de para a emissão da nota.
 */
const CORRECOES: ReadonlyArray<{ chave: string; sql: string; params: (municipio: string) => unknown[] }> = [
  {
    chave: "fix:nfse-fiscal-acao",
    sql: `UPDATE portal_servicos SET dados = jsonb_set(dados::jsonb, '{fiscal_acao}', '"nfse"')
          WHERE municipio = $1 AND slug = 'nfse' AND dados->>'fiscal_acao' = 'debitos'`,
    params: (municipio) => [municipio],
  },
];

async function aplicarCorrecoes(municipio: string, aplicado: Set<string>): Promise<void> {
  for (const c of CORRECOES) {
    const chave = `${municipio}:${c.chave}`;
    if (aplicado.has(chave)) continue;
    await db().query(c.sql, c.params(municipio));
    await db().query("INSERT INTO portal_seed_aplicado (chave) VALUES ($1) ON CONFLICT DO NOTHING", [chave]);
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
      db().query("SELECT dados FROM portal_ambientes WHERE municipio = $1 ORDER BY ordem, slug", [municipio]),
      db().query("SELECT dados FROM portal_categorias WHERE municipio = $1 ORDER BY ordem, slug", [municipio]),
      db().query("SELECT dados FROM portal_servicos WHERE municipio = $1 AND publicado ORDER BY ordem, slug", [municipio]),
    ]);
    const data: CatalogoData = {
      ambientes: amb.rows.map((r) => r.dados as Ambiente),
      categorias: cat.rows.map((r) => r.dados as CategoriaSeed),
      servicos: ser.rows.map((r) => r.dados as ServicoSeed),
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
