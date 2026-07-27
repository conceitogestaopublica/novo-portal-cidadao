const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata valor monetário em BRL; "—" se não for um número válido. */
export function money(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? BRL.format(n) : "—";
}

/**
 * Formata data em pt-BR.
 *
 * O backend serializa data pura (vencimento, competência, emissão) como
 * `YYYY-MM-DD` ou `YYYY-MM-DDT00:00:00.000Z` — sempre meia-noite UTC, sem
 * significado de fuso: é o DIA que importa, não o instante. Interpretar isso
 * como um instante real e converter pra America/Sao_Paulo (UTC-3) subtrairia
 * 3h e mostraria o dia ANTERIOR. Por isso lemos o `YYYY-MM-DD` direto da
 * string, sem passar por `Date`/fuso nenhum.
 *
 * Só cai no fuso explícito quando a string não bate nesse formato (ex.: um
 * timestamp de verdade, tipo `recebido_em`, onde o horário importa).
 */
export function dateBR(v: unknown): string {
  if (!v) return "—";
  const s = String(v);
  const soData = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/);
  if (soData) return `${soData[3]}/${soData[2]}/${soData[1]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
