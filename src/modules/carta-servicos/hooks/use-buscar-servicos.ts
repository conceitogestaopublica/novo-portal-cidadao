import { useQuery } from "@tanstack/react-query";
import { buscarServicos } from "../services/servicos.service";

const SERVICOS_KEYS = {
  all: ["servicos"] as const,
  busca: (termo: string, publico: string) => [...SERVICOS_KEYS.all, "busca", termo, publico] as const,
};

export function useBuscarServicos(termo: string, publico: string) {
  return useQuery({
    queryKey: SERVICOS_KEYS.busca(termo, publico),
    queryFn: () => buscarServicos(termo, publico),
  });
}
