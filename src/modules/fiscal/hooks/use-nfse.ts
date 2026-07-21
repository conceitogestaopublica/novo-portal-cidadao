import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Emitida,
  EmitirNfsePayload,
  Empresa,
  emitirNfse,
  fetchNfseEmpresas,
  fetchNfseItensServico,
  fetchNfseNotas,
  ItemServico,
  Notas,
} from "../services/nfse.service";

export function useNfseEmpresas() {
  return useQuery<Empresa[]>({
    queryKey: ["nfse", "empresas"],
    queryFn: fetchNfseEmpresas,
  });
}

export function useNfseItensServico(economicoId: string) {
  return useQuery<ItemServico[]>({
    queryKey: ["nfse", "itens", economicoId],
    queryFn: () => fetchNfseItensServico(economicoId),
    enabled: !!economicoId,
  });
}

export function useNfseNotas(economicoId: string) {
  return useQuery<Notas>({
    queryKey: ["nfse", "notas", economicoId],
    queryFn: () => fetchNfseNotas(economicoId),
    enabled: !!economicoId,
  });
}

export function useEmitirNfse() {
  const qc = useQueryClient();
  return useMutation<Emitida, Error, EmitirNfsePayload>({
    mutationFn: emitirNfse,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["nfse", "notas", variables.economicoId] });
    },
  });
}
