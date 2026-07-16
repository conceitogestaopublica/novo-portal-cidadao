import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/** Escriturar um serviço na declaração. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost(`/dms/${id}/itens`, body);
}
