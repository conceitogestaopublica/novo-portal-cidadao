import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/shared/config/env";
import { adminById, type Admin } from "@/shared/repos/portal-admin-repo";

/**
 * Sessão do ADMIN da Carta de Serviços — separada da sessão do cidadão
 * (`portal_session`). O cidadão entra por documento+OTP; quem administra o
 * catálogo entra por e-mail+senha, conta própria (`PortalAdmin`). O cookie
 * `portal_admin` é assinado (HMAC-SHA256 com o mesmo `sessionSecret`) e
 * httpOnly — o dono do browser não pode forjá-lo.
 */
export const PORTAL_ADMIN_COOKIE = "portal_admin";
const TTL_SEGUNDOS = 60 * 60 * 8; // 8h

interface AdminSessionPayload {
  adminId: string;
  /** Espelha `PortalAdmin.tokenVersion` no momento do login — diverge = revogado. */
  tokenVersion: number;
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

// `Date.now()` é permitido em runtime do Next (não é o sandbox do Workflow).
function realAgora(): number {
  return Date.now();
}

function decodificarPayload(raw: string): AdminSessionPayload | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  try {
    if (!assinaturaValida(payload, sig)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSessionPayload;
    if (typeof data.adminId !== "string" || typeof data.tokenVersion !== "number" || typeof data.exp !== "number") {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Admin autenticado (ou null) — valida assinatura, expiração E `tokenVersion`
 * contra o banco (consulta por request; volume do admin console é baixo, não
 * compensa cache). Diferença de versão = sessão revogada (senha trocada,
 * conta desativada) mesmo que o cookie em si ainda seja válido e não tenha
 * expirado — é o que dá revogação instantânea em vez de esperar o TTL.
 */
export async function getAdminSession(): Promise<Admin | null> {
  const store = await cookies();
  const raw = store.get(PORTAL_ADMIN_COOKIE)?.value;
  if (!raw) return null;
  const data = decodificarPayload(raw);
  if (!data || data.exp * 1000 <= realAgora()) return null;
  const admin = await adminById(data.adminId);
  if (!admin || admin.tokenVersion !== data.tokenVersion) return null;
  return admin;
}

/** True se há sessão de admin válida. Atalho pra quem só precisa autorizar, não sabe quem é. */
export async function isAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/** Grava o cookie de sessão do admin (só em route handler). */
export async function writeAdminSession(admin: Admin): Promise<void> {
  const exp = Math.floor(realAgora() / 1000) + TTL_SEGUNDOS;
  const payload = Buffer.from(
    JSON.stringify({ adminId: admin.id, tokenVersion: admin.tokenVersion, exp } satisfies AdminSessionPayload),
    "utf8",
  ).toString("base64url");
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
 * houver sessão de admin válida. Use no topo das páginas de `(admin)`.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/entrar");
}
