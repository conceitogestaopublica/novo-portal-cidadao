import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/shared/config/env";

/**
 * Sessão do ADMIN da Carta de Serviços — separada da sessão do cidadão
 * (`portal_session`). O cidadão entra por documento+OTP; o servidor que
 * administra o catálogo entra por senha (`PORTAL_ADMIN_SENHA`). O cookie
 * `portal_admin` é assinado (HMAC-SHA256 com o mesmo `sessionSecret`) e
 * httpOnly — o dono do browser não pode forjá-lo.
 */
export const PORTAL_ADMIN_COOKIE = "portal_admin";
const TTL_SEGUNDOS = 60 * 60 * 8; // 8h

interface AdminSessionPayload {
  /** Marca de admin. */
  adm: true;
  /** Epoch (s) de expiração. */
  exp: number;
}

function assinar(payload: string): string {
  return createHmac("sha256", env.sessionSecret()).update(payload).digest("base64url");
}

function assinaturaValida(payload: string, sig: string): boolean {
  const esperado = Buffer.from(assinar(payload));
  const recebido = Buffer.from(sig);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

async function computeSecure(): Promise<boolean> {
  const forced = env.cookieSecure();
  if (forced === "true") return true;
  if (forced === "false") return false;
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}

/** True se há sessão de admin válida (assinada e não expirada). */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(PORTAL_ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  try {
    if (!assinaturaValida(payload, sig)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSessionPayload;
    return data.adm === true && typeof data.exp === "number" && data.exp * 1000 > realAgora();
  } catch {
    return false;
  }
}

// `Date.now()` é permitido em runtime do Next (não é o sandbox do Workflow).
function realAgora(): number {
  return Date.now();
}

/** Grava o cookie de sessão do admin (só em route handler). */
export async function writeAdminSession(): Promise<void> {
  const exp = Math.floor(realAgora() / 1000) + TTL_SEGUNDOS;
  const payload = Buffer.from(JSON.stringify({ adm: true, exp } satisfies AdminSessionPayload), "utf8").toString("base64url");
  const value = `${payload}.${assinar(payload)}`;
  const store = await cookies();
  store.set(PORTAL_ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: await computeSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SEGUNDOS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  try {
    store.delete(PORTAL_ADMIN_COOKIE);
  } catch {
    /* noop */
  }
}

/**
 * Guarda de página (server component): redireciona para /admin/entrar se não
 * houver sessão de admin. Use no topo das páginas de `(admin)`.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/entrar");
}

/** Confere a senha informada contra `PORTAL_ADMIN_SENHA` (tempo constante). */
export function senhaAdminValida(senha: string): boolean {
  const esperada = env.adminSenha();
  if (!esperada) return false; // fail-closed: sem senha configurada, ninguém entra
  const a = Buffer.from(senha);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
