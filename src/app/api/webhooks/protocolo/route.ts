import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { atualizarPorOrigemRef } from "@/shared/repos/solicitacao-repo";

/** Mapeia a situação do protocolo (gpe2) para as situações da solicitação do portal. */
function mapearSituacao(s?: string | null): string | null {
  switch ((s ?? "").toLowerCase()) {
    case "aberto": return "ABERTA";
    case "tramitando": return "EM_ANDAMENTO";
    case "deferido":
    case "indeferido": return "CONCLUIDA";
    case "arquivado": return "CANCELADA";
    default: return null; // desconhecido → não altera a situação
  }
}

function tokenValido(recebido: string | null, esperado: string): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const schema = z.object({
  origem_ref: z.string().min(1),
  protocolo_id: z.union([z.string(), z.number()]).optional(),
  numero: z.string().optional(),
  situacao: z.string().optional(),
});

/**
 * Webhook do gpe2 (Protocolo) → atualiza a situação da solicitação. Autenticado
 * pelo token da gestora (`X-Protocolo-Token`), resolvido pelo tenant do host.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ ok: false, message: "Município não encontrado" }, { status: 404 });
  if (!tenant.gpe2ProtocoloToken) {
    return NextResponse.json({ ok: false, message: "Integração de protocolo não configurada." }, { status: 401 });
  }

  const token = req.headers.get("x-protocolo-token");
  if (!tokenValido(token, tenant.gpe2ProtocoloToken)) {
    return NextResponse.json({ ok: false, message: "Token inválido." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });

  const n = await atualizarPorOrigemRef(tenant.municipio, parsed.data.origem_ref, {
    situacao: mapearSituacao(parsed.data.situacao),
    protocoloId: parsed.data.protocolo_id != null ? String(parsed.data.protocolo_id) : null,
    numero: parsed.data.numero ?? null,
  });

  if (n === 0) return NextResponse.json({ ok: false, message: "Solicitação não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, atualizadas: n });
}
