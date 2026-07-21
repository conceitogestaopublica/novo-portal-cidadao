import { baixarArquivo } from "@/shared/lib/baixar-arquivo";
import { postJson, requestJsonOrError } from "@/shared/lib/client-api";

export type Empresa = {
  economicoId: string;
  inscricaoMunicipal: string;
  situacao: string;
  ativo: boolean;
};

/**
 * Serviço que a empresa presta. Atenção: `id` é do VÍNCULO empresa↔serviço; o
 * que a emissão espera é o `itemServicoId` (o item da LC116). Mandar o `id`
 * daqui devolve "Item da lista LC116 inexistente".
 */
export type ItemServico = {
  id: string;
  itemServicoId: string;
  codigo: string;
  descricao: string;
};

export type Nota = {
  id: string;
  numero: number;
  serie: string;
  situacao: string;
  dataEmissao: string;
  competencia: string;
  valorServicos: number;
  valorIss: number;
  issRetido: boolean;
  tomadorNome: string;
  tomadorDocumento: string | null;
  discriminacao: string;
};
export type Notas = { items: Nota[]; total: number };
export type Emitida = { numero: number; serie: string; codigoVerificacao: string; valorIss: number };

export interface EmitirNfsePayload {
  economicoId: string;
  itemServicoId: string;
  discriminacao: string;
  valorServicos: number;
  issRetido: boolean;
  tomador: { nome: string; documento: string | null };
}

export function fetchNfseEmpresas() {
  return requestJsonOrError<Empresa[]>("/api/fiscal/nfse/economicos");
}

export function fetchNfseItensServico(economicoId: string) {
  return requestJsonOrError<ItemServico[]>(`/api/fiscal/nfse/itens-servico?economicoId=${economicoId}`);
}

export function fetchNfseNotas(economicoId: string) {
  return requestJsonOrError<Notas>(`/api/fiscal/nfse?economicoId=${economicoId}&perPage=50`);
}

export function emitirNfse(payload: EmitirNfsePayload) {
  return postJson<Emitida>("/api/fiscal/nfse", payload, "Falha ao emitir.");
}

/**
 * Download do DANFSE (PDF) — disparado por clique, não é dado cacheável, por
 * isso não vira query do React Query. Reaproveita o helper genérico de
 * download em blob.
 */
export function baixarDanfse(notaId: string) {
  return baixarArquivo(`/api/fiscal/nfse/${notaId}/danfse`);
}
