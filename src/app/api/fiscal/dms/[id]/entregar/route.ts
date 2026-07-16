import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/** Entregar a declaração — gera a guia do ISS (ou dispensa, no Simples). */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost(`/dms/${id}/entregar`, body);
}
