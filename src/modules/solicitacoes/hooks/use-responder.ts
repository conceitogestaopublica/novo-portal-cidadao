import { useMutation } from "@tanstack/react-query";
import { responderSolicitacao } from "../services/responder.service";
import type { ResponderSolicitacaoInput } from "../schemas/solicitacoes.schema";

export function useResponderSolicitacao(id: string) {
  return useMutation({
    mutationFn: (data: ResponderSolicitacaoInput) => responderSolicitacao(id, data),
  });
}
