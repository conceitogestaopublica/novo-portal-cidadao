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

async function seedSeVazio(): Promise<void> {
  const { rows } = await db().query("SELECT count(*)::int AS n FROM portal_ambientes");
  if ((rows[0]?.n ?? 0) > 0) return;
  for (let i = 0; i < AMBIENTES_SEED.length; i++) {
    const a = AMBIENTES_SEED[i];
    await db().query("INSERT INTO portal_ambientes (slug, ordem, dados) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING", [a.slug, i, JSON.stringify(a)]);
  }
  for (let i = 0; i < CATEGORIAS_SEED.length; i++) {
    const c = CATEGORIAS_SEED[i];
    await db().query("INSERT INTO portal_categorias (slug, ambiente_slug, ordem, dados) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO NOTHING", [c.slug, c.ambienteSlug, i, JSON.stringify(c)]);
  }
  for (let i = 0; i < SERVICOS_SEED.length; i++) {
    const s = SERVICOS_SEED[i];
    await db().query("INSERT INTO portal_servicos (slug, categoria_slug, publicado, ordem, dados) VALUES ($1,$2,true,$3,$4) ON CONFLICT (slug) DO NOTHING", [s.slug, s.categoriaSlug, i, JSON.stringify(s)]);
  }
}

/** Catálogo (do banco do portal). 1ª carga semeia da semente; fallback = semente. */
export async function carregarCatalogo(): Promise<CatalogoData> {
  if (g.__portalCatalogo) return g.__portalCatalogo;
  try {
    await seedSeVazio();
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
