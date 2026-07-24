import { baixarArquivo } from "@/shared/lib/baixar-arquivo";
import { postJson, requestJsonOrError } from "@/shared/lib/client-api";

export type Instituicao = {
  id: string;
  cnpjBase: string;
  razaoSocial: string;
};

export type Declaracao = {
  id: string;
  protocolo: string;
  modulo: string;
  situacao: string;
  competenciaInicio: string;
  totalIssqnARecolher: number;
  qtdErros: number;
  qtdAlertas: number;
  importadaEm: string;
};

export type Apontamento = {
  gravidade: string;
  codigo: string | null;
  registro: string;
  linha: number | null;
  mensagem: string;
};

export type DeclaracaoDetalhe = { apontamentos: Apontamento[] };

export type ResultadoImport = {
  declaracaoId: string;
  protocolo: string;
  situacao: string;
  modulo: string;
  competencia: string;
  totalIssqnARecolher: number;
  qtdErros: number;
  qtdAlertas: number;
};

export type ResultadoEncerramento = {
  competencia: string;
  totalGuias: number;
  valorTotal: number;
  guias: { guiaId: string; numero: string; valor: number }[];
};

export function fetchDesifInstituicoes() {
  return requestJsonOrError<Instituicao[]>("/api/fiscal/desif");
}

export function fetchDesifDeclaracoes(instituicaoId: string) {
  return requestJsonOrError<Declaracao[]>(
    `/api/fiscal/desif/declaracoes?instituicaoId=${instituicaoId}`,
  );
}

export function fetchDesifDetalhe(declaracaoId: string) {
  return requestJsonOrError<DeclaracaoDetalhe>(`/api/fiscal/desif/declaracoes/${declaracaoId}`);
}

export function importarDesif(payload: { conteudo: string; nomeArquivo: string }) {
  return postJson<ResultadoImport>("/api/fiscal/desif/importar", payload, "Não foi possível concluir.");
}

export function encerrarDesif(declaracaoId: string, dataVencimento: string) {
  return postJson<ResultadoEncerramento>(
    `/api/fiscal/desif/declaracoes/${declaracaoId}/encerrar`,
    { dataVencimento },
    "Não foi possível concluir.",
  );
}

/** Comprovante de entrega (PDF assinado) — vale para qualquer declaração recebida, inclusive rejeitada. */
export function baixarComprovante(declaracaoId: string) {
  return baixarArquivo(`/api/fiscal/desif/declaracoes/${declaracaoId}/comprovante`);
}
