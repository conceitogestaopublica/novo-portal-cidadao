import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/**
 * Encerra a competência e gera a guia.
 *
 * É ato do próprio banco — por isso a rota existe na área do contribuinte e não
 * só no ERP. O sistema não apura sozinho.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost(`/desif/declaracoes/${id}/encerrar`, body);
}
