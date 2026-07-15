import "server-only";
import { db } from "@/shared/lib/db";
import { invalidarCatalogo } from "./catalogo-repo";
import type { Ambiente, CategoriaSeed, ServicoSeed } from "./catalogo-seed";

/**
 * Repositório de ESCRITA do catálogo (admin da Carta de Serviços). Diferente do
 * `catalogo-repo` (leitura pública, só publicados), aqui lemos TUDO — inclusive
 * serviços despublicados — e gravamos. Toda escrita invalida o cache em memória.
 *
 * As tabelas guardam o objeto inteiro em `dados` (JSONB); as colunas relacionais
 * (`slug`, `ambiente_slug`, `categoria_slug`, `ordem`, `publicado`) são espelho
 * para ordenar/filtrar/juntar.
 */

export interface AdminServico extends ServicoSeed {
  publicado: boolean;
}

export interface AdminCatalogo {
  ambientes: Ambiente[];
  categorias: CategoriaSeed[];
  servicos: AdminServico[];
}

/** Carrega o catálogo completo (todos os serviços, publicados ou não). */
export async function carregarCatalogoAdmin(): Promise<AdminCatalogo> {
  const [amb, cat, ser] = await Promise.all([
    db().query("SELECT dados FROM portal_ambientes ORDER BY ordem, slug"),
    db().query("SELECT dados FROM portal_categorias ORDER BY ordem, slug"),
    db().query("SELECT dados, publicado FROM portal_servicos ORDER BY ordem, slug"),
  ]);
  return {
    ambientes: amb.rows.map((r) => r.dados as Ambiente),
    categorias: cat.rows.map((r) => r.dados as CategoriaSeed),
    servicos: ser.rows.map((r) => ({ ...(r.dados as ServicoSeed), publicado: r.publicado as boolean })),
  };
}

function slugify(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Cria/atualiza um ambiente (chave = slug). */
export async function salvarAmbiente(a: Ambiente, ordem?: number): Promise<void> {
  const slug = a.slug || slugify(a.nome);
  const dados: Ambiente = { ...a, slug };
  await db().query(
    `INSERT INTO portal_ambientes (slug, ordem, dados) VALUES ($1, COALESCE($2, 0), $3)
     ON CONFLICT (slug) DO UPDATE SET dados = EXCLUDED.dados, ordem = COALESCE($2, portal_ambientes.ordem)`,
    [slug, ordem ?? null, JSON.stringify(dados)],
  );
  invalidarCatalogo();
}

/** Cria/atualiza uma categoria (chave = slug). */
export async function salvarCategoria(c: CategoriaSeed, ordem?: number): Promise<void> {
  const slug = c.slug || slugify(c.nome);
  const dados: CategoriaSeed = { ...c, slug };
  await db().query(
    `INSERT INTO portal_categorias (slug, ambiente_slug, ordem, dados) VALUES ($1, $2, COALESCE($3, 0), $4)
     ON CONFLICT (slug) DO UPDATE SET ambiente_slug = EXCLUDED.ambiente_slug, dados = EXCLUDED.dados, ordem = COALESCE($3, portal_categorias.ordem)`,
    [slug, c.ambienteSlug, ordem ?? null, JSON.stringify(dados)],
  );
  invalidarCatalogo();
}

/** Cria/atualiza um serviço (chave = slug). */
export async function salvarServico(s: ServicoSeed, publicado: boolean, ordem?: number): Promise<void> {
  const slug = s.slug || slugify(s.titulo);
  const dados: ServicoSeed = { ...s, slug };
  await db().query(
    `INSERT INTO portal_servicos (slug, categoria_slug, publicado, ordem, dados) VALUES ($1, $2, $3, COALESCE($4, 0), $5)
     ON CONFLICT (slug) DO UPDATE SET categoria_slug = EXCLUDED.categoria_slug, publicado = EXCLUDED.publicado, dados = EXCLUDED.dados, ordem = COALESCE($4, portal_servicos.ordem)`,
    [slug, s.categoriaSlug, publicado, ordem ?? null, JSON.stringify(dados)],
  );
  invalidarCatalogo();
}

export async function excluirAmbiente(slug: string): Promise<{ bloqueado?: string }> {
  const { rows } = await db().query("SELECT count(*)::int AS n FROM portal_categorias WHERE ambiente_slug = $1", [slug]);
  if ((rows[0]?.n ?? 0) > 0) return { bloqueado: "Há categorias vinculadas a este ambiente." };
  await db().query("DELETE FROM portal_ambientes WHERE slug = $1", [slug]);
  invalidarCatalogo();
  return {};
}

export async function excluirCategoria(slug: string): Promise<{ bloqueado?: string }> {
  const { rows } = await db().query("SELECT count(*)::int AS n FROM portal_servicos WHERE categoria_slug = $1", [slug]);
  if ((rows[0]?.n ?? 0) > 0) return { bloqueado: "Há serviços vinculados a esta categoria." };
  await db().query("DELETE FROM portal_categorias WHERE slug = $1", [slug]);
  invalidarCatalogo();
  return {};
}

export async function excluirServico(slug: string): Promise<void> {
  await db().query("DELETE FROM portal_servicos WHERE slug = $1", [slug]);
  invalidarCatalogo();
}

export { slugify };
