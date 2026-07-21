import { postJson, requestJsonOrError } from "@/shared/lib/client-api";

export type Pendente = {
  id: string;
  numeroNota: string | null;
  competencia: string | null;
  valorIss: number;
};
export type Pendentes = { total: number; valorIss: number; notas: Pendente[] };

export interface DeclararPresteiPayload {
  tomadorDocumento: string;
  tomadorNome: string | null;
  numeroNota: string;
  competencia: string;
  dataEmissao: string;
  discriminacao: string | null;
  valorServicos: number;
  valorIss: number;
}

export interface GerarGuiaPresteiPayload {
  notaIds?: string[];
  dataVencimento: string;
}

export function fetchPresteiPendentes() {
  return requestJsonOrError<Pendentes>("/api/fiscal/tomadas/prestei/pendentes");
}

export function declararPrestei(payload: DeclararPresteiPayload) {
  return postJson("/api/fiscal/tomadas/prestei", payload, "Falha na operação.");
}

export function gerarGuiaPrestei(payload: GerarGuiaPresteiPayload) {
  return postJson("/api/fiscal/tomadas/prestei/guia", payload, "Falha na operação.");
}
