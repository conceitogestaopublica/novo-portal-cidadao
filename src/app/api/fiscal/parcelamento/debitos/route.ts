import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Meus débitos de dívida ativa parceláveis para um programa. */
export async function GET(req: Request) {
  const parametroId = new URL(req.url).searchParams.get("parametroId");
  const sp = new URLSearchParams();
  if (parametroId) sp.set("parametroId", parametroId);
  return proxyPortalMe("/parcelamento/debitos", sp.toString() ? sp : undefined);
}
