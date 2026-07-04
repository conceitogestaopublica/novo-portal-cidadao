import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/** Aderir ao parcelamento (gera termo + guias das parcelas). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/parcelamento/aderir", body);
}
