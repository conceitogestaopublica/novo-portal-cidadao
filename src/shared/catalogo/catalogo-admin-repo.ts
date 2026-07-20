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

/** Carrega o catálogo completo de um município (todos os serviços, publicados ou não). */
export async function carregarCatalogoAdmin(municipio: string): Promise<AdminCatalogo> {
  const [amb, cat, ser] = await Promise.all([
    db().query("SELECT dados FROM portal_ambientes WHERE municipio = $1 ORDER BY ordem, slug", [municipio]),
    db().query("SELECT dados FROM portal_categorias WHERE municipio = $1 ORDER BY ordem, slug", [municipio]),
    db().query("SELECT dados, publicado FROM portal_servicos WHERE municipio = $1 ORDER BY ordem, slug", [municipio]),
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

/** Cria/atualiza um ambiente (chave = município + slug). */
export async function salvarAmbiente(municipio: string, a: Ambiente, ordem?: number): Promise<void> {
  const slug = a.slug || slugify(a.nome);
  const dados: Ambiente = { ...a, slug };
  await db().query(
    `INSERT INTO portal_ambientes (municipio, slug, ordem, dados) VALUES ($1, $2, COALESCE($3, 0), $4)
     ON CONFLICT (municipio, slug) DO UPDATE SET dados = EXCLUDED.dados, ordem = COALESCE($3, portal_ambientes.ordem)`,
    [municipio, slug, ordem ?? null, JSON.stringify(dados)],
  );
  invalidarCatalogo(municipio);
}

/** Cria/atualiza uma categoria (chave = município + slug). */
export async function salvarCategoria(municipio: string, c: CategoriaSeed, ordem?: number): Promise<void> {
  const slug = c.slug || slugify(c.nome);
  const dados: CategoriaSeed = { ...c, slug };
  await db().query(
    `INSERT INTO portal_categorias (municipio, slug, ambiente_slug, ordem, dados) VALUES ($1, $2, $3, COALESCE($4, 0), $5)
     ON CONFLICT (municipio, slug) DO UPDATE SET ambiente_slug = EXCLUDED.ambiente_slug, dados = EXCLUDED.dados, ordem = COALESCE($4, portal_categorias.ordem)`,
    [municipio, slug, c.ambienteSlug, ordem ?? null, JSON.stringify(dados)],
  );
  invalidarCatalogo(municipio);
}

/** Cria/atualiza um serviço (chave = município + slug). */
export async function salvarServico(municipio: string, s: ServicoSeed, publicado: boolean, ordem?: number): Promise<void> {
  const slug = s.slug || slugify(s.titulo);
  const dados: ServicoSeed = { ...s, slug };
  await db().query(
    `INSERT INTO portal_servicos (municipio, slug, categoria_slug, publicado, ordem, dados) VALUES ($1, $2, $3, $4, COALESCE($5, 0), $6)
     ON CONFLICT (municipio, slug) DO UPDATE SET categoria_slug = EXCLUDED.categoria_slug, publicado = EXCLUDED.publicado, dados = EXCLUDED.dados, ordem = COALESCE($5, portal_servicos.ordem)`,
    [municipio, slug, s.categoriaSlug, publicado, ordem ?? null, JSON.stringify(dados)],
  );
  invalidarCatalogo(municipio);
}

export async function excluirAmbiente(municipio: string, slug: string): Promise<{ bloqueado?: string }> {
  const { rows } = await db().query(
    "SELECT count(*)::int AS n FROM portal_categorias WHERE municipio = $1 AND ambiente_slug = $2",
    [municipio, slug],
  );
  if ((rows[0]?.n ?? 0) > 0) return { bloqueado: "Há categorias vinculadas a este ambiente." };
  await db().query("DELETE FROM portal_ambientes WHERE municipio = $1 AND slug = $2", [municipio, slug]);
  invalidarCatalogo(municipio);
  return {};
}

export async function excluirCategoria(municipio: string, slug: string): Promise<{ bloqueado?: string }> {
  const { rows } = await db().query(
    "SELECT count(*)::int AS n FROM portal_servicos WHERE municipio = $1 AND categoria_slug = $2",
    [municipio, slug],
  );
  if ((rows[0]?.n ?? 0) > 0) return { bloqueado: "Há serviços vinculados a esta categoria." };
  await db().query("DELETE FROM portal_categorias WHERE municipio = $1 AND slug = $2", [municipio, slug]);
  invalidarCatalogo(municipio);
  return {};
}

export async function excluirServico(municipio: string, slug: string): Promise<void> {
  await db().query("DELETE FROM portal_servicos WHERE municipio = $1 AND slug = $2", [municipio, slug]);
  invalidarCatalogo(municipio);
}

export { slugify };
