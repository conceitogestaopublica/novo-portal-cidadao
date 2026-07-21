import type { MeResponse } from "@/shared/types/portal";

/**
 * `me` e `atuar-como` são conceitualmente sessão/auth, mas hoje o único
 * consumidor é o `AtuarComoSeletor` aqui em fiscal — mantidos neste módulo
 * para não introduzir um arquivo em `modules/auth` fora do escopo desta
 * extração (outro agente pode estar mexendo lá agora).
 */
export async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Falha ao carregar a sessão.");
  return res.json();
}

export async function postAtuarComo(contribuinteId: string): Promise<void> {
  const res = await fetch("/api/auth/atuar-como", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contribuinteId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message ?? "Não foi possível trocar de identidade.");
  }
}
