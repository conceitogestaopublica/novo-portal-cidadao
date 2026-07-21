import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  abrirCompetenciaDms,
  entregarDms,
  escriturarItemDms,
  fetchDmsDetalhe,
  fetchDmsLista,
  fetchEmpresasEconomico,
  fetchItensServicoDms,
  removerItemDms,
  type AbrirCompetenciaDto,
  type EntregarDmsDto,
  type EscriturarItemDto,
} from "../services/fiscal-dms.service";

export function useEmpresasEconomico() {
  return useQuery({
    queryKey: ["dms", "empresas"],
    queryFn: fetchEmpresasEconomico,
  });
}

export function useDmsLista(economicoId: string) {
  return useQuery({
    queryKey: ["dms", "lista", economicoId],
    queryFn: () => fetchDmsLista(economicoId),
    enabled: !!economicoId,
  });
}

export function useDmsDetalhe(id: string | null) {
  return useQuery({
    queryKey: ["dms", "detalhe", id],
    queryFn: () => fetchDmsDetalhe(id as string),
    enabled: !!id,
  });
}

export function useItensServicoDms(economicoId: string) {
  return useQuery({
    queryKey: ["dms", "itens-servico", economicoId],
    queryFn: () => fetchItensServicoDms(economicoId),
    enabled: !!economicoId,
  });
}

export function useAbrirCompetenciaDms(economicoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AbrirCompetenciaDto) => abrirCompetenciaDms(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dms", "lista", economicoId] }),
  });
}

export function useEscriturarItemDms(economicoId: string, dmsId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: EscriturarItemDto) => escriturarItemDms(dmsId as string, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dms", "lista", economicoId] });
      if (dmsId) qc.invalidateQueries({ queryKey: ["dms", "detalhe", dmsId] });
    },
  });
}

export function useEntregarDms(economicoId: string, dmsId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: EntregarDmsDto) => entregarDms(dmsId as string, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dms", "lista", economicoId] });
      if (dmsId) qc.invalidateQueries({ queryKey: ["dms", "detalhe", dmsId] });
    },
  });
}

export function useRemoverItemDms(economicoId: string, dmsId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removerItemDms(dmsId as string, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dms", "lista", economicoId] });
      if (dmsId) qc.invalidateQueries({ queryKey: ["dms", "detalhe", dmsId] });
    },
  });
}
