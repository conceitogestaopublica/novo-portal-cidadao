import { proxyPortalMeRaw } from "@/shared/adapters/portal-me-client";

/**
 * Comprovante de entrega (PDF assinado) de uma declaração minha. O backend
 * confere a posse pela instituição antes de gerar, e assina com o certificado
 * do município — a spec manda o contribuinte guardar este protocolo.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyPortalMeRaw(`/desif/declaracoes/${id}/comprovante`);
}
