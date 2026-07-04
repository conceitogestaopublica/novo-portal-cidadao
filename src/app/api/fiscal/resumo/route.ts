import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Resumo de débitos do contribuinte logado (qtd + valor em aberto). */
export async function GET() {
  return proxyPortalMe("/guias/resumo");
}
