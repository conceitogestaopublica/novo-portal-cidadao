import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Resumo da dívida ativa em aberto do contribuinte logado. */
export async function GET() {
  return proxyPortalMe("/divida-ativa/resumo");
}
