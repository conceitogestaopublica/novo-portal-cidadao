import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/** Simular meu parcelamento (sem aderir). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/parcelamento/simular", body);
}
