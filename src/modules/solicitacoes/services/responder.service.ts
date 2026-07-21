import { postJson } from "@/shared/lib/client-api";
import type { ResponderSolicitacaoInput } from "../schemas/solicitacoes.schema";

export function responderSolicitacao(id: string, data: ResponderSolicitacaoInput) {
  return postJson(`/api/solicitacoes/${id}/responder`, data, "Não foi possível enviar sua resposta.");
}
