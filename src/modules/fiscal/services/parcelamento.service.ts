import { postJson, requestJsonOrError } from "@/shared/lib/client-api";

export type Programa = {
  id: string;
  nome: string;
  fundamentoLegal?: string | null;
  maxParcelas: number;
  entradaPercentual: number;
  valorMinimoParcela: number;
  textoConfissao?: string | null;
};
export type Debito = {
  inscricaoId: string;
  numero: string;
  saldoAtualizado: number;
  elegivel: boolean;
  motivoInelegivel?: string;
  valorPrincipal?: number;
  valorMulta?: number;
  valorJuros?: number;
  valorCorrecao?: number;
  valorEncargoLegal?: number;
};
export type ResumoSit = { quantidade: number; valorInscrito: number };
export type DebitosResp = { debitos: Debito[]; naoParcelavel?: { jaParceladas?: ResumoSit; ajuizadas?: ResumoSit } };
export type Parcela = { numero: number; dataVencimento: string; valor: number };
export type Simulacao = {
  parametroNome?: string;
  valorConsolidado?: number;
  entradaValor?: number;
  honorariosValor?: number;
  valorTotal?: number;
  qtdParcelas?: number;
  parcelas?: Parcela[];
};
export type Resultado = { id: string; numero: string; valorTotal: number };

export interface SimularOuAderirPayload {
  parametroId: string;
  inscricaoIds: string[];
  qtdParcelas: number;
}

export function fetchProgramasParcelamento() {
  return requestJsonOrError<{ programas: Programa[] }>("/api/fiscal/parcelamento/programas");
}

export function fetchDebitosParcelaveis(programaId: string) {
  return requestJsonOrError<DebitosResp>(`/api/fiscal/parcelamento/debitos?parametroId=${programaId}`);
}

export function simularParcelamento(payload: SimularOuAderirPayload) {
  return postJson<Simulacao>("/api/fiscal/parcelamento/simular", payload, "Falha na operação.");
}

export function aderirParcelamento(payload: SimularOuAderirPayload) {
  return postJson<Resultado>("/api/fiscal/parcelamento/aderir", payload, "Falha na operação.");
}

/** URL do PDF do termo de adesão (BFF) — usada num link `<a target="_blank">`, sem fetch em JS. */
export function parcelamentoTermoUrl(id: string): string {
  return `/api/fiscal/parcelamento/${id}/termo`;
}
