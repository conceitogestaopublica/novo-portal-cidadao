import { useQuery } from "@tanstack/react-query";
import { Apuracao, fetchCertidaoApuracao } from "../services/certidao.service";

export function useCertidaoApuracao() {
  return useQuery<Apuracao>({
    queryKey: ["fiscal", "certidao", "apurar"],
    queryFn: fetchCertidaoApuracao,
  });
}
