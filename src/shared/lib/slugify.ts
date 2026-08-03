/** Sem dependência de servidor (banco/env) — função pura, testável isoladamente. */

/**
 * Normaliza texto para comparação: minúsculas e sem acento.
 *
 * O cidadão digita "certidao"/"debito" sem acento e precisa encontrar
 * "Certidão"/"Débito". Aplicar dos DOIS lados (termo e conteúdo) é o que
 * torna a comparação insensível a acento.
 */
export function normalizarTexto(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function slugify(v: string): string {
  return normalizarTexto(v)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
