import { postJson } from "@/shared/lib/client-api";

export interface LoginSenhaBody {
  documento: string;
  senha: string;
}

export function loginSenha(body: LoginSenhaBody) {
  return postJson("/api/auth/login-senha", body);
}

export interface LoginStartBody {
  documento: string;
}

export interface LoginStartResponse {
  challengeId: string | null;
  canalMascarado: string | null;
  encontrado?: boolean;
  devOtp?: string;
}

export function loginStart(body: LoginStartBody) {
  return postJson<LoginStartResponse>("/api/auth/login-start", body);
}

export interface LoginVerifyBody {
  challengeId: string;
  otp: string;
}

export function loginVerify(body: LoginVerifyBody) {
  return postJson("/api/auth/login-verify", body);
}
