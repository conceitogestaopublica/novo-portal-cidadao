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

// Cache em memória (ancorado no globalThis p/ sobreviver ao HMR em dev). A carga
// do GED, quando existir, invalida este cache.
const g = globalThis as typeof globalThis & { __portalCatalogo?: CatalogoData };

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
async function semearNovidades(): Promise<void> {
  await db().query(`
    CREATE TABLE IF NOT EXISTS portal_seed_aplicado (
      chave TEXT PRIMARY KEY,
      aplicado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  // Reconciliação: o que já existe conta como semeado (não reinsere, não ressuscita).
  await db().query(`
    INSERT INTO portal_seed_aplicado (chave)
    SELECT 'ambiente:' || slug FROM portal_ambientes
    UNION ALL SELECT 'categoria:' || slug FROM portal_categorias
    UNION ALL SELECT 'servico:' || slug FROM portal_servicos
    ON CONFLICT (chave) DO NOTHING`);

  const { rows } = await db().query("SELECT chave FROM portal_seed_aplicado");
  const aplicado = new Set<string>(rows.map((r: { chave: string }) => r.chave));
  const marcar = (chave: string) =>
    db().query("INSERT INTO portal_seed_aplicado (chave) VALUES ($1) ON CONFLICT DO NOTHING", [chave]);

  for (let i = 0; i < AMBIENTES_SEED.length; i++) {
    const a = AMBIENTES_SEED[i];
    if (aplicado.has(`ambiente:${a.slug}`)) continue;
    await db().query("INSERT INTO portal_ambientes (slug, ordem, dados) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING", [a.slug, i, JSON.stringify(a)]);
    await marcar(`ambiente:${a.slug}`);
  }
  for (let i = 0; i < CATEGORIAS_SEED.length; i++) {
    const c = CATEGORIAS_SEED[i];
    if (aplicado.has(`categoria:${c.slug}`)) continue;
    await db().query("INSERT INTO portal_categorias (slug, ambiente_slug, ordem, dados) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO NOTHING", [c.slug, c.ambienteSlug, i, JSON.stringify(c)]);
    await marcar(`categoria:${c.slug}`);
  }
  for (let i = 0; i < SERVICOS_SEED.length; i++) {
    const s = SERVICOS_SEED[i];
    if (aplicado.has(`servico:${s.slug}`)) continue;
    await db().query("INSERT INTO portal_servicos (slug, categoria_slug, publicado, ordem, dados) VALUES ($1,$2,true,$3,$4) ON CONFLICT (slug) DO NOTHING", [s.slug, s.categoriaSlug, i, JSON.stringify(s)]);
    await marcar(`servico:${s.slug}`);
  }

  await aplicarCorrecoes(aplicado);
}

/**
 * Correções pontuais de dado semeado errado. Usa o mesmo registro da semente
 * (roda uma vez por banco), e cada uma é cirúrgica: só toca a linha que ainda
 * tem o valor errado, então uma correção já feita pelo município fica de pé.
 *
 * `nfse` foi semeado com `fiscal_acao: "debitos"` — a página do serviço mandava
 * o prestador para "Meus Débitos" em vez de para a emissão da nota.
 */
const CORRECOES: ReadonlyArray<{ chave: string; sql: string; params: unknown[] }> = [
  {
    chave: "fix:nfse-fiscal-acao",
    sql: `UPDATE portal_servicos SET dados = jsonb_set(dados::jsonb, '{fiscal_acao}', '"nfse"')
          WHERE slug = 'nfse' AND dados->>'fiscal_acao' = 'debitos'`,
    params: [],
  },
];

async function aplicarCorrecoes(aplicado: Set<string>): Promise<void> {
  for (const c of CORRECOES) {
    if (aplicado.has(c.chave)) continue;
    await db().query(c.sql, c.params);
    await db().query("INSERT INTO portal_seed_aplicado (chave) VALUES ($1) ON CONFLICT DO NOTHING", [c.chave]);
  }
}

/** Invalida o cache em memória — chamar após qualquer escrita no catálogo (admin/sync GED). */
export function invalidarCatalogo(): void {
  g.__portalCatalogo = undefined;
}

/** Catálogo (do banco do portal). 1ª carga semeia da semente; fallback = semente. */
export async function carregarCatalogo(): Promise<CatalogoData> {
  if (g.__portalCatalogo) return g.__portalCatalogo;
  try {
    await semearNovidades();
    const [amb, cat, ser] = await Promise.all([
      db().query("SELECT dados FROM portal_ambientes ORDER BY ordem, slug"),
      db().query("SELECT dados FROM portal_categorias ORDER BY ordem, slug"),
      db().query("SELECT dados FROM portal_servicos WHERE publicado ORDER BY ordem, slug"),
    ]);
    const data: CatalogoData = {
      ambientes: amb.rows.map((r) => r.dados as Ambiente),
      categorias: cat.rows.map((r) => r.dados as CategoriaSeed),
      servicos: ser.rows.map((r) => r.dados as ServicoSeed),
    };
    if (data.ambientes.length) {
      g.__portalCatalogo = data;
      return data;
    }
  } catch {
    // banco indisponível — usa a semente em memória (fallback seguro).
  }
  return { ambientes: AMBIENTES_SEED, categorias: CATEGORIAS_SEED, servicos: SERVICOS_SEED };
}
