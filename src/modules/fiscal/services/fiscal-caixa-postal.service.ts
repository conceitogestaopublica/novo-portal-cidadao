import { requestJsonOrError } from "@/shared/lib/client-api";

export function fetchFiscalCaixaPostal() {
  return requestJsonOrError<Record<string, unknown>>("/api/fiscal/caixa-postal");
}
