import { postJson } from "@/shared/lib/client-api";
import type { CriarSolicitacaoInput } from "../schemas/solicitacoes.schema";

export interface CriarSolicitacaoResponse {
  solicitacao?: { protocolo?: string };
}

export function criarSolicitacao(data: CriarSolicitacaoInput) {
  return postJson<CriarSolicitacaoResponse>("/api/solicitacoes", data, "Falha ao abrir a solicitação.");
}
