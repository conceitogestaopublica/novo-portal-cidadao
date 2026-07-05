const MAPA: Record<string, { cor: string; texto: string }> = {
  ABERTA: { cor: "bg-blue-50 text-blue-700", texto: "Aberta" },
  EM_ANDAMENTO: { cor: "bg-amber-50 text-amber-700", texto: "Em andamento" },
  CONCLUIDA: { cor: "bg-green-50 text-green-700", texto: "Concluída" },
  CANCELADA: { cor: "bg-gray-100 text-gray-500", texto: "Cancelada" },
};

export function SituacaoBadge({ situacao }: { situacao: string }) {
  const m = MAPA[situacao] ?? { cor: "bg-gray-100 text-gray-600", texto: situacao };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${m.cor}`}>{m.texto}</span>;
}
