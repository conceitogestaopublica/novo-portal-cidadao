/**
 * Configuração de ambiente do Portal (server-side apenas).
 *
 * O BFF fala com 3 backends via API. As URLs base e o segredo de serviço
 * (`X-Service-Token` do tributário / `x-proxy-secret`) vêm do ambiente; o
 * mapeamento por município fica no `tenant-map`.
 */
function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return v;
}

export const env = {
  /** Base URL do backend do tributário (NestJS), ex.: http://localhost:3000/api/v1 */
  tributarioBaseUrl: () => req("TRIBUTARIO_BASE_URL", "http://localhost:3000/api/v1"),
  /** Segredo compartilhado do BFF → tributário (`X-Service-Token` / `x-proxy-secret`). */
  proxySharedSecret: () => process.env.PROXY_SHARED_SECRET ?? "",
  portalServiceToken: () => process.env.PORTAL_SERVICE_TOKEN ?? "",
  /** Base URL do GED (Laravel) — API do portal. */
  gedBaseUrl: () => process.env.GED_BASE_URL ?? "",
  /** Base URL do gpe2 (Laravel) — API do portal. */
  gpe2BaseUrl: () => process.env.GPE2_BASE_URL ?? "",
  cookieSecure: () => process.env.COOKIE_SECURE,
} as const;
