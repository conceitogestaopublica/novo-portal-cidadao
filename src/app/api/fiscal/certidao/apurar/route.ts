import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Apura a situação fiscal do contribuinte logado (pode emitir CND/CPEN?). */
export async function GET() {
  return proxyPortalMe("/certidao/apurar");
}
