import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** O que eu declarei que prestei e ainda não virou guia. */
export async function GET() {
  return proxyPortalMe("/tomadas/prestei/pendentes");
}
