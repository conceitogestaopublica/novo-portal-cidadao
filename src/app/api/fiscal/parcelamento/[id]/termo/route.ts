import { proxyPortalMeRaw } from "@/shared/adapters/portal-me-client";

/** Termo do parcelamento (PDF). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPortalMeRaw(`/parcelamento/${encodeURIComponent(id)}/termo.pdf`);
}
