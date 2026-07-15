import {
  proxyPortalMe,
  proxyPortalMePost,
} from "@/shared/adapters/portal-me-client";

/**
 * Minhas NFS-e emitidas. `economicoId` é obrigatório — é o filtro por prestador
 * que segura o escopo da consulta (o backend recusa sem ele).
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const sp = new URLSearchParams();
  for (const k of ["economicoId", "page", "perPage", "filter", "competencia"]) {
    const v = q.get(k);
    if (v) sp.set(k, v);
  }
  return proxyPortalMe("/nfse", sp);
}

/** Emitir NFS-e pela empresa escolhida. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/nfse", body);
}
