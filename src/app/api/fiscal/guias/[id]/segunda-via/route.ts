import { proxyPortalMeRaw } from "@/shared/adapters/portal-me-client";

/** 2ª via da guia (PDF) do contribuinte logado — stream do portal-me. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPortalMeRaw(`/guias/${encodeURIComponent(id)}/segunda-via.pdf`);
}
