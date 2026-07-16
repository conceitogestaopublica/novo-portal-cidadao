import {
  proxyPortalMe,
  proxyPortalMePost,
} from "@/shared/adapters/portal-me-client";

/** Minhas declarações. `economicoId` é obrigatório: a DMS é da empresa. */
export async function GET(req: Request) {
  const economicoId = new URL(req.url).searchParams.get("economicoId") ?? "";
  return proxyPortalMe("/dms", new URLSearchParams({ economicoId }));
}

/** Abrir a declaração de uma competência. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/dms", body);
}
