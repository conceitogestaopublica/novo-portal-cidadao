import { postJson } from "@/shared/lib/client-api";

export interface CadastrarBody {
  documento: string;
  nome: string;
  email?: string;
  senha: string;
  prestadorExterno?: boolean;
}

export function cadastrar(body: CadastrarBody) {
  return postJson("/api/auth/cadastrar", body);
}
