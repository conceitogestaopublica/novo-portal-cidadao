import "server-only";
import type { Categoria, Servico } from "@/shared/types/portal";
import { carregarCatalogo } from "./catalogo-repo";
import { PUBLICOS, type CategoriaSeed, type ServicoSeed } from "./catalogo-seed";

/**
 * Catálogo (Carta de Serviços) — agora servido do banco do portal
 * (`portal_ambientes`/`portal_categorias`/`portal_servicos`), com semente
 * automática na 1ª carga e fallback em memória (ver `catalogo-repo`). A carga
 * real virá do GED via `/api/portal/catalogo` para essas mesmas tabelas.
 */

export type { Ambiente } from "./catalogo-seed";

function toPublic(s: ServicoSeed, categorias: CategoriaSeed[]): Servico {
  const cat = categorias.find((c) => c.slug === s.categoriaSlug);
  const { categoriaSlug: _omit, ...rest } = s;
  void _omit;
  return { ...rest, categoria: cat ? { id: cat.id, nome: cat.nome, slug: cat.slug, cor: cat.cor } : null };
}

function categoriaComCount(c: CategoriaSeed, servicos: ServicoSeed[]): Categoria {
  const { ambienteSlug: _a, ...rest } = c;
  void _a;
  return { ...rest, servicos_publicados_count: servicos.filter((s) => s.categoriaSlug === c.slug).length };
}

export async function getAmbientes() {
  const { ambientes, categorias, servicos } = await carregarCatalogo();
  const lista = ambientes.map((a) => ({
    ...a,
    servicos_count: servicos.filter((s) => {
      const cat = categorias.find((c) => c.slug === s.categoriaSlug);
      return cat?.ambienteSlug === a.slug;
    }).length,
  }));
  return { ambientes: lista, totalServicos: servicos.length };
}

/** Home = grade de ambientes + serviços mais procurados. */
export async function getHome() {
  const { ambientes, categorias, servicos } = await carregarCatalogo();
  const ambientesComCount = ambientes.map((a) => ({
    ...a,
    servicos_count: servicos.filter((s) => {
      const cat = categorias.find((c) => c.slug === s.categoriaSlug);
      return cat?.ambienteSlug === a.slug;
    }).length,
  }));
  const maisAcessados = servicos.slice(0, 6).map((s) => toPublic(s, categorias));
  return { ambientes: ambientesComCount, maisAcessados, totalServicos: servicos.length, publicos: PUBLICOS };
}

/** Um ambiente + suas categorias e serviços. */
export async function getAmbiente(slug: string) {
  const { ambientes, categorias, servicos } = await carregarCatalogo();
  const ambiente = ambientes.find((a) => a.slug === slug);
  if (!ambiente) return null;
  const cats = categorias.filter((c) => c.ambienteSlug === slug).map((c) => categoriaComCount(c, servicos));
  const servs = servicos
    .filter((s) => categorias.find((c) => c.slug === s.categoriaSlug)?.ambienteSlug === slug)
    .map((s) => toPublic(s, categorias));
  return { ambiente, categorias: cats, servicos: servs, publicos: PUBLICOS };
}

export async function listServicos(opts?: { q?: string; categoria?: string; publico?: string }) {
  const { categorias, servicos } = await carregarCatalogo();
  let list = servicos;
  if (opts?.categoria) list = list.filter((s) => s.categoriaSlug === opts.categoria);
  if (opts?.publico) list = list.filter((s) => s.publico_alvo === opts.publico);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((s) =>
      [s.titulo, s.descricao_curta, s.descricao_completa, (s.palavras_chave ?? []).join(" ")]
        .join(" ").toLowerCase().includes(q),
    );
  }
  return { items: list.map((s) => toPublic(s, categorias)), total: list.length, publicos: PUBLICOS };
}

export async function getCategoria(slug: string) {
  const { categorias, servicos } = await carregarCatalogo();
  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria) return null;
  const servs = servicos.filter((s) => s.categoriaSlug === slug).map((s) => toPublic(s, categorias));
  return { categoria, servicos: servs, publicos: PUBLICOS };
}

export async function getServico(slug: string) {
  const { categorias, servicos } = await carregarCatalogo();
  const s = servicos.find((x) => x.slug === slug);
  if (!s) return null;
  const relacionados = servicos
    .filter((x) => x.categoriaSlug === s.categoriaSlug && x.slug !== slug)
    .slice(0, 4)
    .map((x) => toPublic(x, categorias));
  return { servico: toPublic(s, categorias), relacionados, publicos: PUBLICOS };
}
