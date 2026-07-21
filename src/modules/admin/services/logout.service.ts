import { postJson } from "@/shared/lib/client-api";

export function logoutAdmin() {
  return postJson<{ ok: boolean }>("/api/admin/logout");
}
