import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Programas de parcelamento ativos (REFIS / ordinário). */
export async function GET() {
  return proxyPortalMe("/parcelamento/programas");
}
