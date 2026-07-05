import "server-only";
import type { TenantConfig } from "@/shared/lib/tenant-map";

/**
 * Adapter do gpe2 — gateway de **Protocolo** (Modelo A: o gpe2 é o protocolo/PAE
 * central; o cidadão abre pelo portal). Espelha o gateway que o gpe2 já tem para
 * o Tributário (`POST /api/protocolo/tributario/abrir` + `GET /api/protocolo/:id`,
 * auth por token de entrada da gestora via header `X-Protocolo-Token`).
 *
 * Requer no gpe2 um endpoint irmão `POST /api/protocolo/portal/abrir`
 * (origem_tipo='portal', origem_ref = protocolo da solicitação) — ver
 * `docs/contrato-gpe2-protocolo-portal.md`.
 */

export interface ProtocoloConfig {
  baseUrl: string;
  gestoraId: number;
  token: string;
}

/** Extrai a config do gateway de Protocolo do gpe2 do tenant; null se não configurado. */
export function protocoloConfigDe(tenant: TenantConfig): ProtocoloConfig | null {
  const baseUrl = tenant.baseUrls.gpe2;
  const gestoraId = tenant.gpe2GestoraId;
  const token = tenant.gpe2ProtocoloToken;
  if (!baseUrl || !gestoraId || !token) return null;
  return { baseUrl, gestoraId, token };
}

export interface AbrirProtocoloInput {
  origemRef: string; // protocolo da solicitação no portal (idempotência)
  descricao?: string | null;
  solicitanteDoc?: string | null;
  solicitanteNome?: string | null;
  assuntoId?: number | null;
}

export interface ProtocoloResult {
  ok: boolean;
  protocoloId?: number;
  numero?: string;
  novo?: boolean;
  mensagem?: string;
}

/** Abre (ou recupera, idempotente) um protocolo no gpe2 a partir da solicitação. */
export async function abrirProtocoloGpe2(cfg: ProtocoloConfig, input: AbrirProtocoloInput): Promise<ProtocoloResult> {
  const res = await fetch(`${cfg.baseUrl}/api/protocolo/portal/abrir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Protocolo-Token": cfg.token,
    },
    body: JSON.stringify({
      gestora_id: cfg.gestoraId,
      origem_ref: input.origemRef,
      descricao: input.descricao ?? null,
      solicitante_doc: input.solicitanteDoc ?? null,
      solicitante_nome: input.solicitanteNome ?? null,
      assunto_id: input.assuntoId ?? null,
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as ProtocoloResult;
  return { ...data, ok: res.ok && data.ok !== false };
}

/** Consulta situação/tramitação de um protocolo no gpe2. */
export async function consultarProtocoloGpe2(cfg: ProtocoloConfig, protocoloId: number) {
  const res = await fetch(`${cfg.baseUrl}/api/protocolo/${protocoloId}`, {
    headers: { "X-Protocolo-Token": cfg.token },
    cache: "no-store",
  });
  return res.json().catch(() => null);
}
