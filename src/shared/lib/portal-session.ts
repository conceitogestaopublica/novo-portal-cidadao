import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { Cidadao, Representacao } from "@/shared/types/portal";
import { env } from "@/shared/config/env";

/**
 * Sessão do Portal — o BFF é o dono. O cookie `portal_session` guarda a conta +
 * tenant + os tokens de backend server-side, no formato `<payload>.<hmac>`:
 * o payload é base64url(JSON) e o HMAC-SHA256 (com `sessionSecret`) garante a
 * INTEGRIDADE — o cliente não pode forjar/adulterar a sessão (ex.: a lista de
 * empresas que pode "atuar como"). O cliente NUNCA vê JWT de backend.
 *
 * O cookie é httpOnly, mas httpOnly só impede o JS de LER — o dono do browser
 * ainda pode ENVIAR um cookie arbitrário; por isso a assinatura é obrigatória.
 */
export const PORTAL_SESSION_COOKIE = "portal_session";

/** Assinatura HMAC-SHA256 (base64url) do payload. */
function assinar(payload: string): string {
  return createHmac("sha256", env.sessionSecret()).update(payload).digest("base64url");
}

/** Verifica a assinatura em tempo constante. */
function assinaturaValida(payload: string, sig: string): boolean {
  const esperado = Buffer.from(assinar(payload));
  const recebido = Buffer.from(sig);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export interface PortalSession {
  /** Identidade ATIVA — o `id` é o contribuinteId usado no JWT do tributário. */
  conta: Cidadao;
  /** Pessoa logada (fixa na sessão; não muda ao alternar "atuar como"). */
  pessoa?: Cidadao;
  /** Identidades que a pessoa pode atuar (titular + empresas representadas). */
  representados?: Representacao[];
  municipio: string;
  /** JWT CONTRIBUINTE do tributário (server-side apenas). */
  tributarioToken?: string;
  /** Epoch (s) de expiração do tributarioToken. */
  tributarioTokenExp?: number;
  /**
   * Id da `PortalConta` (documento+senha), se a pessoa tiver uma — quem entra
   * só por OTP sem nunca ter se cadastrado por senha não tem. Junto com
   * `contaTokenVersion`, permite revogar a sessão na hora quando a senha troca
   * (ver `ensureToken` em `portal-me-client.ts`).
   */
  contaId?: string;
  /** `PortalConta.tokenVersion` capturado no login/cadastro. */
  contaTokenVersion?: number;
}

/** Lê a sessão do cookie httpOnly (server-side). Retorna null se ausente/inválida/adulterada. */
export async function readSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const raw = store.get(PORTAL_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null; // sem assinatura → rejeita (cookie legado/forjado)
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  try {
    if (!assinaturaValida(payload, sig)) return null;
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
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
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const value = `${payload}.${assinar(payload)}`;
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
