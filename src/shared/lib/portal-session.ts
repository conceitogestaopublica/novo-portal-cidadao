import { cookies, headers } from "next/headers";
import type { Cidadao } from "@/shared/types/portal";
import { env } from "@/shared/config/env";

/**
 * Sessão do Portal — o BFF é o dono. O cookie `portal_session` guarda uma
 * referência OPACA (assinada) à conta + tenant + os tokens de backend
 * server-side. O cliente NUNCA vê JWT de backend.
 *
 * M0: apenas a leitura/escrita do cookie e o shape da sessão. A emissão real
 * (após OTP) e o vínculo com o JWT CONTRIBUINTE do tributário entram no M1.
 */
export const PORTAL_SESSION_COOKIE = "portal_session";

export interface PortalSession {
  conta: Cidadao;
  municipio: string;
  /** JWT CONTRIBUINTE do tributário (server-side apenas). */
  tributarioToken?: string;
  /** Epoch (s) de expiração do tributarioToken. */
  tributarioTokenExp?: number;
}

/** Lê a sessão do cookie httpOnly (server-side). Retorna null se ausente/ inválida. */
export async function readSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const raw = store.get(PORTAL_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as PortalSession;
  } catch {
    return null;
  }
}

/** Conta autenticada (ou null) — o que o shell/nav consome. */
export async function getSessionCidadao(): Promise<Cidadao | null> {
  const s = await readSession();
  return s?.conta ?? null;
}

/**
 * Persiste a sessão no cookie httpOnly. Válido em route handlers (graváveis);
 * em render (RSC) o `set` lança e é absorvido.
 */
export async function writeSession(session: PortalSession): Promise<void> {
  const store = await cookies();
  const value = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  try {
    store.set(PORTAL_SESSION_COOKIE, value, {
      httpOnly: true,
      secure: await computeSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  } catch {
    /* contexto de render: cookie read-only */
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  try {
    store.delete(PORTAL_SESSION_COOKIE);
  } catch {
    /* noop */
  }
}

async function computeSecure(): Promise<boolean> {
  const forced = env.cookieSecure();
  if (forced === "true") return true;
  if (forced === "false") return false;
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}
