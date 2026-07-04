import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Caixa postal (DTE) do contribuinte logado. */
export async function GET(req: Request) {
  const situacao = new URL(req.url).searchParams.get("situacao");
  const sp = new URLSearchParams();
  if (situacao) sp.set("situacao", situacao);
  return proxyPortalMe("/caixa-postal", sp.toString() ? sp : undefined);
}
