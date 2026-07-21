import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  declararPrestei,
  DeclararPresteiPayload,
  fetchPresteiPendentes,
  gerarGuiaPrestei,
  GerarGuiaPresteiPayload,
  Pendentes,
} from "../services/prestei.service";

const PRESTEI_PENDENTES_KEY = ["prestei", "pendentes"];

export function usePresteiPendentes() {
  return useQuery<Pendentes>({
    queryKey: PRESTEI_PENDENTES_KEY,
    queryFn: fetchPresteiPendentes,
  });
}

export function useDeclararPrestei() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, DeclararPresteiPayload>({
    mutationFn: declararPrestei,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRESTEI_PENDENTES_KEY });
    },
  });
}

export function useGerarGuiaPrestei() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, GerarGuiaPresteiPayload>({
    mutationFn: gerarGuiaPrestei,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRESTEI_PENDENTES_KEY });
    },
  });
}
