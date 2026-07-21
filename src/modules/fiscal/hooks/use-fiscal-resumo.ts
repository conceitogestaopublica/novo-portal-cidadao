import { useQuery } from "@tanstack/react-query";
import { fetchFiscalResumo } from "../services/fiscal-resumo.service";

export function useFiscalResumo() {
  return useQuery({
    queryKey: ["fiscal", "resumo"],
    queryFn: fetchFiscalResumo,
  });
}
