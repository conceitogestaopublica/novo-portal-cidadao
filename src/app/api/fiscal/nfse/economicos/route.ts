import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Minhas empresas — para escolher por qual delas emitir. */
export async function GET() {
  return proxyPortalMe("/nfse/economicos");
}
