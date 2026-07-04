import { proxyPortalMeRaw } from "@/shared/adapters/portal-me-client";

/**
 * 2ª via da guia (PDF) do contribuinte logado — stream do portal-me.
 * `?atualizar=1` recalcula juros/multa da guia vencida e emite a 2ª via atualizada.
 * `?data=AAAA-MM-DD` define o novo vencimento até quando os acréscimos são calculados.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = new URL(req.url).searchParams;
  const sp = new URLSearchParams();
  if (q.get("atualizar") === "1") {
    sp.set("atualizar", "1");
    const data = q.get("data");
    if (data) sp.set("data", data);
  }
  return proxyPortalMeRaw(
    `/guias/${encodeURIComponent(id)}/segunda-via.pdf`,
    sp.toString() ? sp : undefined,
  );
}
