import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Serviços (LC116) que a minha empresa presta — alimenta o select da emissão. */
export async function GET(req: Request) {
  const economicoId = new URL(req.url).searchParams.get("economicoId") ?? "";
  return proxyPortalMe(
    "/nfse/itens-servico",
    new URLSearchParams({ economicoId }),
  );
}
