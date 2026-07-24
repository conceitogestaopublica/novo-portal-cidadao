import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Detalhe de uma declaração minha (a posse é conferida no backend). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyPortalMe(`/desif/declaracoes/${id}`);
}
