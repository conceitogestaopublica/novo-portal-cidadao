import { requestJsonOrError } from "@/shared/lib/client-api";

/**
 * Resumo agregado de débitos em aberto do contribuinte ativo. O formato do
 * payload varia conforme o backend fiscal — o componente lê campos com `pick()`.
 */
export function fetchFiscalResumo() {
  return requestJsonOrError<Record<string, unknown>>("/api/fiscal/resumo");
}
