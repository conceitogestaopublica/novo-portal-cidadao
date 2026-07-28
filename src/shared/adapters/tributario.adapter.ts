import "server-only";
import { env } from "@/shared/config/env";
import type { TenantConfig } from "@/shared/lib/tenant-map";

/**
 * Adapter do backend do Tributário (NestJS).
 *
 * - `portal-auth/contribuinte/resolver|token`: serviço-a-serviço com header
 *   `X-Service-Token` (= `PORTAL_SERVICE_TOKEN`). O BFF é o único cliente.
 * - `portal-me/*`: autoatendimento com o JWT CONTRIBUINTE (Bearer), escopado
 *   pelo tenant. O tenant vai no header `x-tenant-subdomain` (+ `x-proxy-secret`).
 *
 * Roda SEMPRE no servidor (nunca no cliente): o token de serviço e o JWT do
 * contribuinte não podem vazar para o browser.
 */

function tenantHeaders(t: TenantConfig): Record<string, string> {
  const secret = env.proxySharedSecret();
  const sub = t.tributarioSubdomain;
  if (!sub) return {};
  return {
    "x-tenant-subdomain": sub,
    ...(secret ? { "x-proxy-secret": secret } : {}),
  };
}

export interface ResolverResult {
  contribuinteId: string;
  nome: string;
  canalMascarado: string | null;
}

export interface RepresentacaoResult {
  contribuinteId: string;
  nome: string;
  documento: string | null;
  tipo: "titular" | "empresa";
  papel?: string;
}

/** O tributário embrulha respostas em `{ data: ... }` (WrapperDataInterceptor). */
function unwrap<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in (json as Record<string, unknown>)) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/** O tributário recusou (403): o documento não/não mais representa esse contribuinte. */
export class IdentidadeNaoAutorizadaError extends Error {}

export class TributarioAdapter {
  constructor(private readonly tenant: TenantConfig) {}

  private get base() {
    return this.tenant.baseUrls.tributario;
  }

  /** Resolve o contribuinte por documento (passo 1 do OTP). null se não encontrado. */
  async resolver(documento: string): Promise<ResolverResult | null> {
    const res = await fetch(`${this.base}/portal-auth/contribuinte/resolver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": env.portalServiceToken(),
        ...tenantHeaders(this.tenant),
      },
      body: JSON.stringify({ documento, tenantId: this.tenant.tributarioSubdomain }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`resolver falhou: ${res.status}`);
    const data = unwrap<ResolverResult | { encontrado: false }>(await res.json());
    if (data && "encontrado" in data && data.encontrado === false) return null;
    return data as ResolverResult;
  }

  /**
   * Autocadastro do prestador de FORA: cria a ficha de contribuinte dele.
   *
   * Quem presta serviço aqui mas não é do município não existe no cadastro —
   * e o cadastro do portal só aceita contribuinte. Sem isto ele dependeria de
   * alguém declarar por ele antes de conseguir se cadastrar.
   *
   * Idempotente no backend: se um tomador já declarou nota dele, reusa a ficha.
   */
  async cadastrarPrestadorExterno(input: {
    documento: string;
    nome: string;
    municipioIbge?: number | null;
  }): Promise<{ contribuinteId: string }> {
    const res = await fetch(
      `${this.base}/portal-auth/contribuinte/prestador-externo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Token": env.portalServiceToken(),
          ...tenantHeaders(this.tenant),
        },
        body: JSON.stringify({ ...input, tenantId: this.tenant.tributarioSubdomain }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      throw new Error(`cadastro do prestador externo falhou: ${res.status}`);
    }
    return unwrap<{ contribuinteId: string }>(await res.json());
  }

  /**
   * Lista as identidades que o documento pode "atuar como": ele mesmo (titular)
   * + as empresas que representa. Vazio se o documento não é contribuinte.
   */
  async representacoes(documento: string): Promise<RepresentacaoResult[]> {
    const res = await fetch(`${this.base}/portal-auth/contribuinte/representacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": env.portalServiceToken(),
        ...tenantHeaders(this.tenant),
      },
      body: JSON.stringify({ documento, tenantId: this.tenant.tributarioSubdomain }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`representacoes falhou: ${res.status}`);
    const data = unwrap<{ representacoes: RepresentacaoResult[] }>(await res.json());
    return data?.representacoes ?? [];
  }

  /**
   * Emite o JWT CONTRIBUINTE (passo 2, após validar o OTP; ou renovação/"atuar
   * como"). `documento` é a identidade fixa da sessão (o titular) — o backend
   * revalida com ele, a cada emissão, que `contribuinteId` ainda é ele mesmo ou
   * uma empresa que ele de fato representa (fonte de verdade do vínculo).
   */
  async emitirToken(
    contribuinteId: string,
    documento: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const res = await fetch(`${this.base}/portal-auth/contribuinte/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": env.portalServiceToken(),
        ...tenantHeaders(this.tenant),
      },
      body: JSON.stringify({ contribuinteId, documento, tenantId: this.tenant.tributarioSubdomain }),
      cache: "no-store",
    });
    if (res.status === 403) throw new IdentidadeNaoAutorizadaError();
    if (!res.ok) throw new Error(`token falhou: ${res.status}`);
    return unwrap<{ accessToken: string; expiresIn: number }>(await res.json());
  }

  /** Chamada autenticada ao `portal-me` com o JWT CONTRIBUINTE do cidadão logado. */
  async portalMe<T>(
    path: string,
    token: string,
    init?: { method?: string; body?: unknown; searchParams?: URLSearchParams },
  ): Promise<{ ok: boolean; status: number; data: T | null; raw?: Response }> {
    const qs = init?.searchParams ? `?${init.searchParams.toString()}` : "";
    const hasBody = init?.body !== undefined;
    const res = await fetch(`${this.base}/portal-me${path}${qs}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...tenantHeaders(this.tenant),
      },
      body: hasBody ? JSON.stringify(init!.body) : undefined,
      cache: "no-store",
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("application/json") ? unwrap<T>(await res.json()) : null;
    return { ok: res.ok, status: res.status, data, raw: res };
  }
}
