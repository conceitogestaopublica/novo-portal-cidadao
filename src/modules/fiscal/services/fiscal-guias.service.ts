import { requestJsonOrError } from "@/shared/lib/client-api";

export function fetchFiscalGuias(pagas: boolean) {
  return requestJsonOrError<Record<string, unknown>>(`/api/fiscal/guias${pagas ? "?pagas=1" : ""}`);
}

/**
 * Baixa o PDF da 2ª via. `atualizar` recalcula juros/multa; `data` (AAAA-MM-DD)
 * é o novo vencimento até quando os acréscimos são calculados (senão, hoje).
 *
 * Fica de fora do React Query de propósito: é um download binário disparado
 * por clique (não uma leitura cacheável), e quem chama precisa decidir na
 * hora, a partir do status da resposta (409 = vencida, `podeAtualizar`), se
 * abre um modal — não se encaixa no fluxo onSuccess/onError de useMutation.
 */
export async function baixarSegundaViaGuia(id: string, atualizar: boolean, data?: string) {
  const qs = atualizar ? `?atualizar=1${data ? `&data=${data}` : ""}` : "";
  const res = await fetch(`/api/fiscal/guias/${id}/segunda-via${qs}`);
  if (res.ok && (res.headers.get("content-type") ?? "").includes("pdf")) {
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    window.open(u, "_blank");
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
    return { ok: true as const };
  }
  const msg = (await res.json().catch(() => null)) as { message?: string; podeAtualizar?: boolean } | null;
  return { ok: false as const, status: res.status, msg };
}
