import { headers } from "next/headers";
import { extractSubdomain } from "@/shared/lib/extract-subdomain";
import { env } from "@/shared/config/env";

/**
 * Mapa `município → { tenants dos 3 sistemas + baseUrls + tokens }`.
 *
 * O BFF resolve o município pelo subdomínio e injeta o contexto de tenant no
 * formato que CADA backend espera (tributário: `x-tenant-subdomain`; GED:
 * `portal_slug`; gpe2: `gestora_id`). Chave comum recomendada = código IBGE.
 *
 * MVP: mapa em memória, alimentado por env (`PORTAL_TENANTS` JSON) com um
 * fallback de desenvolvimento. Evolução: tabela `portal_tenants` no banco do
 * portal.
 */
export interface TenantConfig {
  /** Chave do município (ex.: código IBGE ou slug acordado). */
  municipio: string;
  nome: string;
  /** Subdomínio do tributário (multi-tenant por subdomínio). */
  tributarioSubdomain: string;
  /** `portal_slug` da UG no GED. */
  gedPortalSlug?: string;
  /** Gestora/tenant no gpe2. */
  gpe2Gestora?: string;
  baseUrls: {
    tributario: string;
    ged?: string;
    gpe2?: string;
  };
}

function loadMap(): Record<string, TenantConfig> {
  const raw = process.env.PORTAL_TENANTS;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, TenantConfig>;
    } catch {
      // JSON inválido em PORTAL_TENANTS — cai no fallback de dev.
    }
  }
  // Fallback de desenvolvimento: um único município apontando para o backend local.
  const devSub = process.env.DEV_TENANT_SUBDOMAIN ?? "dev";
  return {
    [devSub]: {
      municipio: devSub,
      nome: process.env.DEV_TENANT_NOME ?? "Município de Demonstração",
      tributarioSubdomain: devSub,
      gedPortalSlug: process.env.DEV_GED_SLUG,
      gpe2Gestora: process.env.DEV_GPE2_GESTORA,
      baseUrls: {
        tributario: env.tributarioBaseUrl(),
        ged: env.gedBaseUrl() || undefined,
        gpe2: env.gpe2BaseUrl() || undefined,
      },
    },
  };
}

const MAP = loadMap();

/** Resolve o tenant a partir de um subdomínio (ou null se não mapeado). */
export function resolveTenantBySubdomain(sub: string | null): TenantConfig | null {
  if (!sub) {
    // Sem subdomínio (localhost puro): usa o município de dev, se houver um só.
    const keys = Object.keys(MAP);
    return keys.length === 1 ? MAP[keys[0]] : null;
  }
  return MAP[sub] ?? null;
}

/** Resolve o tenant a partir do header `host` da requisição atual (server-side). */
export async function currentTenant(): Promise<TenantConfig | null> {
  const h = await headers();
  return resolveTenantBySubdomain(extractSubdomain(h.get("host") ?? ""));
}
