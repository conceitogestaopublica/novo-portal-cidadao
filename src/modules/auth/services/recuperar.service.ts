import { postJson } from "@/shared/lib/client-api";

export interface RecuperarBody {
  documento: string;
}

export interface RecuperarResponse {
  message: string;
  devLink?: string;
  envioConfigurado?: boolean;
}

export function recuperar(body: RecuperarBody) {
  return postJson<RecuperarResponse>("/api/auth/recuperar", body);
}
