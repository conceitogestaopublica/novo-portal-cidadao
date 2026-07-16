import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Detalhe de uma declaração minha (o backend confere a posse pela empresa). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyPortalMe(`/dms/${id}`);
}
