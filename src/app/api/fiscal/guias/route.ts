import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Minhas guias em aberto. `?pagas=1` lista só as pagas (comprovantes). */
export async function GET(req: Request) {
  const sp = new URLSearchParams();
  if (new URL(req.url).searchParams.get("pagas") === "1") sp.set("pagas", "1");
  return proxyPortalMe("/guias", sp.toString() ? sp : undefined);
}
