import { postJson, requestJsonOrError, requestNoContentOrError } from "@/shared/lib/client-api";

export type Empresa = { economicoId: string; inscricaoMunicipal: string; ativo: boolean };
export type ItemServico = { id: string; itemServicoId: string; codigo: string; descricao: string };
export type ItemDms = {
  id: string;
  codigo: string;
  descricao: string;
  baseCalculo: number;
  aliquota: number;
  valorIss: number;
  retido: boolean;
  tomadorDocumento: string | null;
};
export type Dms = {
  id: string;
  competenciaAno: number;
  competenciaMes: number;
  situacao: string;
  dataEntrega: string | null;
  totalBase: number;
  totalIss: number;
  qtdItens?: number;
  itens?: ItemDms[];
};

export type AbrirCompetenciaDto = { economicoId: string; competenciaAno: number; competenciaMes: number };
export type EscriturarItemDto = {
  itemServicoLc116Id: string;
  baseCalculo: number;
  retido: boolean;
  tomadorDocumento: string | null;
};
export type EntregarDmsDto = { dataVencimento: string };

/**
 * Mesma rota do cadastro econômico usada pelo NFS-e — mantida local ao DMS
 * (não compartilhada) para não criar acoplamento com o componente de NFS-e,
 * que está fora do escopo desta extração.
 */
export function fetchEmpresasEconomico() {
  return requestJsonOrError<Empresa[]>("/api/fiscal/nfse/economicos");
}

export function fetchItensServicoDms(economicoId: string) {
  return requestJsonOrError<ItemServico[]>(`/api/fiscal/nfse/itens-servico?economicoId=${economicoId}`);
}

export function fetchDmsLista(economicoId: string) {
  return requestJsonOrError<Dms[]>(`/api/fiscal/dms?economicoId=${economicoId}`);
}

export function fetchDmsDetalhe(id: string) {
  return requestJsonOrError<Dms>(`/api/fiscal/dms/${id}`);
}

export function abrirCompetenciaDms(dto: AbrirCompetenciaDto) {
  return postJson<{ id: string }>("/api/fiscal/dms", dto, "Falha na operação.");
}

export function escriturarItemDms(dmsId: string, dto: EscriturarItemDto) {
  return postJson(`/api/fiscal/dms/${dmsId}/itens`, dto, "Falha na operação.");
}

export function entregarDms(dmsId: string, dto: EntregarDmsDto) {
  return postJson(`/api/fiscal/dms/${dmsId}/entregar`, dto, "Falha na operação.");
}

export function removerItemDms(dmsId: string, itemId: string) {
  return requestNoContentOrError(
    `/api/fiscal/dms/${dmsId}/itens/${itemId}`,
    { method: "DELETE" },
    "Falha na operação.",
  );
}
