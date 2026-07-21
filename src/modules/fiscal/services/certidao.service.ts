import { requestJsonOrError } from "@/shared/lib/client-api";

export type Apuracao = {
  apuracao?: { totalExigivel?: number; totalSuspenso?: number; itens?: unknown[] };
  tipoPrevisto?: string;
  podeEmitir?: boolean;
};

export function fetchCertidaoApuracao() {
  return requestJsonOrError<Apuracao>("/api/fiscal/certidao/apurar");
}

/**
 * Emissão do PDF da certidão — disparada por clique (não é dado cacheável),
 * por isso não vira query do React Query. `fetch` cru porque a resposta pode
 * ser tanto o binário do PDF quanto um JSON de erro (não há como usar
 * `requestJsonOrError`, que assume sempre JSON).
 */
export async function emitirCertidaoPdf(): Promise<
  { ok: true; blob: Blob } | { ok: false; mensagem: string }
> {
  const res = await fetch("/api/fiscal/certidao");
  if (res.ok && (res.headers.get("content-type") ?? "").includes("pdf")) {
    return { ok: true, blob: await res.blob() };
  }
  const msg = await res.json().catch(() => null);
  return {
    ok: false,
    mensagem: (msg as { message?: string } | null)?.message ?? "Não foi possível emitir a certidão.",
  };
}
