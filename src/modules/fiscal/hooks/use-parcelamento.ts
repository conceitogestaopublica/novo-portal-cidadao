import { useMutation, useQuery } from "@tanstack/react-query";
import {
  aderirParcelamento,
  DebitosResp,
  fetchDebitosParcelaveis,
  fetchProgramasParcelamento,
  Programa,
  Resultado,
  simularParcelamento,
  SimularOuAderirPayload,
  Simulacao,
} from "../services/parcelamento.service";

export function useProgramasParcelamento() {
  return useQuery<{ programas: Programa[] }>({
    queryKey: ["fiscal-parcelamento-programas"],
    queryFn: fetchProgramasParcelamento,
  });
}

export function useDebitosParcelamento(programaId: string) {
  return useQuery<DebitosResp>({
    queryKey: ["fiscal-parcelamento-debitos", programaId],
    queryFn: () => fetchDebitosParcelaveis(programaId),
    enabled: !!programaId,
  });
}

export function useSimularParcelamento() {
  return useMutation<Simulacao, Error, SimularOuAderirPayload>({
    mutationFn: simularParcelamento,
  });
}

export function useAderirParcelamento() {
  return useMutation<Resultado, Error, SimularOuAderirPayload>({
    mutationFn: aderirParcelamento,
  });
}
