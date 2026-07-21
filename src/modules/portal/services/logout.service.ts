import { postJson } from "@/shared/lib/client-api";

export function logoutCidadao() {
  return postJson<{ ok: boolean }>("/api/auth/logout");
}
