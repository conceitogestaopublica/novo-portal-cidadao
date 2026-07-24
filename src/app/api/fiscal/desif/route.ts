import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/**
 * As instituições financeiras do contribuinte logado.
 *
 * Sem parâmetro de identificação: o escopo vem do token no backend. Um
 * `contribuinteId` na query seria justamente a porta que o `portal-me` fecha.
 */
export async function GET() {
  return proxyPortalMe("/desif/instituicoes");
}
