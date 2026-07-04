import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Minhas guias (2ª via / débito efetivo). Filtro opcional `?situacao=`. */
export async function GET(req: Request) {
  const situacao = new URL(req.url).searchParams.get("situacao");
  const sp = new URLSearchParams();
  if (situacao) sp.set("situacao", situacao);
  return proxyPortalMe("/guias", sp.toString() ? sp : undefined);
}
