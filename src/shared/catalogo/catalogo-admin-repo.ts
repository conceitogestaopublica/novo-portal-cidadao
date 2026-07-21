import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { invalidarCatalogo } from "./catalogo-repo";
import type { Ambiente, CategoriaSeed, ServicoSeed } from "./catalogo-seed";

/**
 * Repositório de ESCRITA do catálogo (admin da Carta de Serviços). Diferente do
 * `catalogo-repo` (leitura pública, só publicados), aqui lemos TUDO — inclusive
 * serviços despublicados — e gravamos. Toda escrita invalida o cache em memória.
 *
 * As tabelas guardam o objeto inteiro em `dados` (JSONB); as colunas relacionais
 * (`slug`, `ambienteSlug`, `categoriaSlug`, `ordem`, `publicado`) são espelho
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
    prisma.portalAmbiente.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
    prisma.portalCategoria.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
    prisma.portalServico.findMany({ where: { municipio }, orderBy: [{ ordem: "asc" }, { slug: "asc" }] }),
  ]);
  return {
    ambientes: amb.map((r) => r.dados as unknown as Ambiente),
    categorias: cat.map((r) => r.dados as unknown as CategoriaSeed),
    servicos: ser.map((r) => ({ ...(r.dados as unknown as ServicoSeed), publicado: r.publicado })),
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
  const dados = { ...a, slug } as unknown as Prisma.InputJsonValue;
  await prisma.portalAmbiente.upsert({
    where: { municipio_slug: { municipio, slug } },
    create: { municipio, slug, ordem: ordem ?? 0, dados },
    update: { dados, ...(ordem !== undefined ? { ordem } : {}) },
  });
  invalidarCatalogo(municipio);
}

/** Cria/atualiza uma categoria (chave = município + slug). */
export async function salvarCategoria(municipio: string, c: CategoriaSeed, ordem?: number): Promise<void> {
  const slug = c.slug || slugify(c.nome);
  const dados = { ...c, slug } as unknown as Prisma.InputJsonValue;
  await prisma.portalCategoria.upsert({
    where: { municipio_slug: { municipio, slug } },
    create: { municipio, slug, ambienteSlug: c.ambienteSlug, ordem: ordem ?? 0, dados },
    update: { ambienteSlug: c.ambienteSlug, dados, ...(ordem !== undefined ? { ordem } : {}) },
  });
  invalidarCatalogo(municipio);
}

/** Cria/atualiza um serviço (chave = município + slug). */
export async function salvarServico(
  municipio: string,
  s: ServicoSeed,
  publicado: boolean,
  ordem?: number,
): Promise<void> {
  const slug = s.slug || slugify(s.titulo);
  const dados = { ...s, slug } as unknown as Prisma.InputJsonValue;
  await prisma.portalServico.upsert({
    where: { municipio_slug: { municipio, slug } },
    create: { municipio, slug, categoriaSlug: s.categoriaSlug, publicado, ordem: ordem ?? 0, dados },
    update: { categoriaSlug: s.categoriaSlug, publicado, dados, ...(ordem !== undefined ? { ordem } : {}) },
  });
  invalidarCatalogo(municipio);
}

export async function excluirAmbiente(municipio: string, slug: string): Promise<{ bloqueado?: string }> {
  const n = await prisma.portalCategoria.count({ where: { municipio, ambienteSlug: slug } });
  if (n > 0) return { bloqueado: "Há categorias vinculadas a este ambiente." };
  await prisma.portalAmbiente.delete({ where: { municipio_slug: { municipio, slug } } });
  invalidarCatalogo(municipio);
  return {};
}

export async function excluirCategoria(municipio: string, slug: string): Promise<{ bloqueado?: string }> {
  const n = await prisma.portalServico.count({ where: { municipio, categoriaSlug: slug } });
  if (n > 0) return { bloqueado: "Há serviços vinculados a esta categoria." };
  await prisma.portalCategoria.delete({ where: { municipio_slug: { municipio, slug } } });
  invalidarCatalogo(municipio);
  return {};
}

export async function excluirServico(municipio: string, slug: string): Promise<void> {
  await prisma.portalServico.delete({ where: { municipio_slug: { municipio, slug } } });
  invalidarCatalogo(municipio);
}

export { slugify };
