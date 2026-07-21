import { requestJsonOrError, postJson } from "@/shared/lib/client-api";

export interface CheckTokenRedefinirResponse {
  valido?: boolean;
}

export function checarTokenRedefinir(token: string) {
  return requestJsonOrError<CheckTokenRedefinirResponse>(`/api/auth/redefinir?token=${encodeURIComponent(token)}`);
}

export interface RedefinirBody {
  token: string;
  senha: string;
}

export function redefinir(body: RedefinirBody) {
  return postJson("/api/auth/redefinir", body, "Falha ao redefinir");
}
