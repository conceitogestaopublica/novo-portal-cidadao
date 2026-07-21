import { useQuery } from "@tanstack/react-query";
import { fetchFiscalGuias } from "../services/fiscal-guias.service";

export function useFiscalGuias(pagas: boolean) {
  return useQuery({
    queryKey: ["fiscal", "guias", pagas ? "pagas" : "abertas"],
    queryFn: () => fetchFiscalGuias(pagas),
  });
}
