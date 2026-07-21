export type ApiMessage = string | string[];

export interface ApiErrorPayload {
  message?: ApiMessage;
  /** Erros de validação por campo (422): objeto aninhado cujas folhas são as mensagens. */
  errors?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorPayload;

  constructor(status: number, message: string, details?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/** True se o erro veio de uma resposta 401 — sessão expirada/inválida. */
export function isSessaoExpirada(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}
