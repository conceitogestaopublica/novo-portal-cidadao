import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/**
 * Declarar um serviço que EU prestei no município (sou de fora, sem retenção).
 * O prestador é sempre o dono do token — o backend não aceita outro.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/tomadas/prestei", body);
}
