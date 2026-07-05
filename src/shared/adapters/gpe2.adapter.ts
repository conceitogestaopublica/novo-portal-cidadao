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
  // O gpe2 responde em snake_case (`protocolo_id`), conforme o contrato. Mapeamos
  // para o camelCase do portal — sem isso o vínculo do protocolo se perde.
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: res.ok && data.ok !== false,
    protocoloId: (data.protocolo_id ?? data.protocoloId) as number | undefined,
    numero: data.numero as string | undefined,
    novo: data.novo as boolean | undefined,
    mensagem: data.mensagem as string | undefined,
  };
}

export interface TimelineEvento {
  tipo: "abertura" | "tramite" | "parecer" | "exigencia" | "resposta" | "encerramento";
  data: string;
  titulo: string;
  texto?: string | null;
  de?: string | null;
  para?: string | null;
  status?: string | null;
  dt_recepcao?: string | null;
}

export interface ProtocoloDetalhe {
  ok: boolean;
  numero?: string;
  situacao?: string;
  situacao_label?: string;
  encerrado?: boolean;
  origem_ref?: string;
  data_abertura?: string;
  data_encerramento?: string | null;
  eventos?: TimelineEvento[];
}

/** Consulta situação + linha do tempo completa de um protocolo no gpe2. */
export async function consultarProtocoloGpe2(cfg: ProtocoloConfig, protocoloId: number): Promise<ProtocoloDetalhe | null> {
  const res = await fetch(`${cfg.baseUrl}/api/protocolo/${protocoloId}`, {
    headers: { "X-Protocolo-Token": cfg.token },
    cache: "no-store",
  });
  return res.json().catch(() => null);
}

/** O solicitante responde a uma exigência do protocolo (via portal). */
export async function responderProtocoloGpe2(
  cfg: ProtocoloConfig,
  input: { origemRef: string; texto: string },
): Promise<{ ok: boolean; mensagem?: string }> {
  const res = await fetch(`${cfg.baseUrl}/api/protocolo/portal/responder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Protocolo-Token": cfg.token },
    body: JSON.stringify({ gestora_id: cfg.gestoraId, origem_ref: input.origemRef, texto: input.texto }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; mensagem?: string };
  return { ok: res.ok && data.ok !== false, mensagem: data.mensagem };
}
