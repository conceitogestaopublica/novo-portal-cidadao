import { useQuery } from "@tanstack/react-query";
import { fetchFiscalDividaAtiva } from "../services/fiscal-divida-ativa.service";

export function useFiscalDividaAtiva() {
  return useQuery({
    queryKey: ["fiscal", "divida"],
    queryFn: fetchFiscalDividaAtiva,
  });
}
