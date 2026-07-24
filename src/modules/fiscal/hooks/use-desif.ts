import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Declaracao,
  DeclaracaoDetalhe,
  encerrarDesif,
  fetchDesifDeclaracoes,
  fetchDesifDetalhe,
  fetchDesifInstituicoes,
  importarDesif,
  Instituicao,
  ResultadoEncerramento,
  ResultadoImport,
} from "../services/desif.service";

export function useDesifInstituicoes() {
  return useQuery<Instituicao[]>({
    queryKey: ["desif", "instituicoes"],
    queryFn: fetchDesifInstituicoes,
  });
}

export function useDesifDeclaracoes(instituicaoId: string) {
  return useQuery<Declaracao[]>({
    queryKey: ["desif", "declaracoes", instituicaoId],
    queryFn: () => fetchDesifDeclaracoes(instituicaoId),
    enabled: !!instituicaoId,
  });
}

/** Só busca os apontamentos quando há erro a mostrar. */
export function useDesifDetalhe(declaracaoId: string | undefined, comErro: boolean) {
  return useQuery<DeclaracaoDetalhe>({
    queryKey: ["desif", "detalhe", declaracaoId],
    queryFn: () => fetchDesifDetalhe(declaracaoId!),
    enabled: !!declaracaoId && comErro,
  });
}

export function useImportarDesif(instituicaoId: string) {
  const qc = useQueryClient();
  return useMutation<ResultadoImport, Error, { conteudo: string; nomeArquivo: string }>({
    mutationFn: importarDesif,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["desif", "declaracoes", instituicaoId] });
    },
  });
}

export function useEncerrarDesif(instituicaoId: string) {
  const qc = useQueryClient();
  return useMutation<ResultadoEncerramento, Error, { declaracaoId: string; dataVencimento: string }>({
    mutationFn: ({ declaracaoId, dataVencimento }) => encerrarDesif(declaracaoId, dataVencimento),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["desif", "declaracoes", instituicaoId] });
    },
  });
}
