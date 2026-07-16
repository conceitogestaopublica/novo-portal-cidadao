import { proxyPortalMeDelete } from "@/shared/adapters/portal-me-client";

/** Remover um serviço escriturado (só em rascunho — o backend valida). */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await ctx.params;
  return proxyPortalMeDelete(`/dms/${id}/itens/${itemId}`);
}
