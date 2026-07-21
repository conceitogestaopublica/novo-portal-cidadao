import { ApiError, type ApiErrorPayload } from "./http-client";

/**
 * O 422 das rotas BFF (espelhando o backend) traz o motivo útil dentro de
 * `errors` ({campo: {regra: texto}}) e deixa em `message` algo genérico
 * ("Entity Validation Error") que não diz nada ao cidadão. Colhe as folhas de
 * texto e só cai no `message` se não houver nenhuma.
 */
function collectFieldErrorMessages(errors: unknown, acc: string[]): void {
  if (!errors || typeof errors !== "object") return;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (typeof value === "string") acc.push(value);
    else if (value && typeof value === "object") collectFieldErrorMessages(value, acc);
  }
}

function normalizeErrorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (payload?.errors) {
    const fieldMessages: string[] = [];
    collectFieldErrorMessages(payload.errors, fieldMessages);
    if (fieldMessages.length > 0) return Array.from(new Set(fieldMessages)).join(" ");
  }
  if (!payload?.message) return fallback;
  return Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return response.json().catch(() => null);
}

/** GET/POST/etc. contra uma rota BFF (`/api/*`) que devolve JSON, lançando `ApiError` em falha. */
export async function requestJsonOrError<TResponse>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fallbackMessage = "Erro ao processar solicitação.",
): Promise<TResponse> {
  const response = await fetch(input, init);
  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      normalizeErrorMessage(payload as ApiErrorPayload | null, fallbackMessage),
      (payload as ApiErrorPayload | null) ?? undefined,
    );
  }

  return payload as TResponse;
}

/** Mutação contra uma rota BFF sem corpo de resposta relevante (ex.: DELETE), lançando `ApiError` em falha. */
export async function requestNoContentOrError(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fallbackMessage = "Erro ao processar solicitação.",
): Promise<void> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const payload = await readPayload(response);
    throw new ApiError(response.status, normalizeErrorMessage(payload as ApiErrorPayload | null, fallbackMessage));
  }
}

/** POST/PATCH com corpo JSON — atalho sobre `requestJsonOrError` para o caso comum. */
export function postJson<TResponse>(
  path: string,
  body?: unknown,
  fallbackMessage?: string,
): Promise<TResponse> {
  return requestJsonOrError<TResponse>(
    path,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined },
    fallbackMessage,
  );
}
