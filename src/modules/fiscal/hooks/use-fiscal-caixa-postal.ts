import { useQuery } from "@tanstack/react-query";
import { fetchFiscalCaixaPostal } from "../services/fiscal-caixa-postal.service";

export function useFiscalCaixaPostal() {
  return useQuery({
    queryKey: ["fiscal", "caixa"],
    queryFn: fetchFiscalCaixaPostal,
  });
}
