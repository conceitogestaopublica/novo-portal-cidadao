import { requestJsonOrError } from "@/shared/lib/client-api";
import type { Servico } from "@/shared/types/portal";

export interface BuscarServicosResult {
  items: Servico[];
  total: number;
  publicos: Record<string, string>;
}

export function buscarServicos(termo: string, publico: string) {
  const p = new URLSearchParams();
  if (termo) p.set("q", termo);
  if (publico) p.set("publico", publico);
  return requestJsonOrError<BuscarServicosResult>(`/api/servicos?${p.toString()}`);
}
