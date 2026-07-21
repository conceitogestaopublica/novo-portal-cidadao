import { requestJsonOrError } from "@/shared/lib/client-api";

export function fetchFiscalDividaAtiva() {
  return requestJsonOrError<Record<string, unknown>>("/api/fiscal/divida-ativa");
}
