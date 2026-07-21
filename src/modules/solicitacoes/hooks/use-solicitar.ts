import { useMutation } from "@tanstack/react-query";
import { criarSolicitacao } from "../services/solicitar.service";

export function useCriarSolicitacao() {
  return useMutation({ mutationFn: criarSolicitacao });
}
