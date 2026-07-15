import { proxyPortalMeRaw } from "@/shared/adapters/portal-me-client";

/** DANFSE (PDF) de uma nota minha. O backend confere o prestador antes de gerar. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyPortalMeRaw(`/nfse/${id}/danfse.pdf`);
}
