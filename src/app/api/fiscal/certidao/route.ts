import { proxyPortalMeRaw } from "@/shared/adapters/portal-me-client";

/** Emite e baixa a certidão (CND/CPEN) assinada do contribuinte logado. */
export async function GET() {
  return proxyPortalMeRaw("/certidao.pdf");
}
