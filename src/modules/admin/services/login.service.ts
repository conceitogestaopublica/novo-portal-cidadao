import { postJson } from "@/shared/lib/client-api";
import type { AdminLoginInput } from "../schemas/admin-login.schema";

export function loginAdmin(data: AdminLoginInput) {
  return postJson<{ ok: boolean }>("/api/admin/login", data, "Falha ao entrar");
}
