import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";
import { criarDesafio } from "@/shared/lib/otp-store";
import { loginStartSchema as schema } from "@/modules/auth/schemas/auth.schema";

/**
 * Passo 1 do login: resolve o contribuinte no tributário e cria o desafio OTP.
 * Anti-enumeração: responde igual (`challengeId` + canal mascarado) quer o
 * contribuinte exista ou não — só cria desafio real se existir.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Documento inválido" }, { status: 400 });
  }
  const documento = parsed.data.documento.replace(/\D/g, "");

  const adapter = new TributarioAdapter(tenant);
  let resolved;
  try {
    resolved = await adapter.resolver(documento);
  } catch {
    return NextResponse.json({ message: "Serviço indisponível. Tente novamente." }, { status: 502 });
  }

  if (!resolved) {
    // Resposta genérica (não revela se o documento existe).
    return NextResponse.json({ challengeId: null, canalMascarado: null, encontrado: false });
  }

  const { challengeId, otp } = await criarDesafio({
    contribuinteId: resolved.contribuinteId,
    nome: resolved.nome,
    documento,
    municipio: tenant.municipio,
  });

  // Produção: enviar `otp` pelo canal do contribuinte (e-mail/SMS). Dev: ecoar.
  const devEcho = process.env.DEV_OTP_ECHO === "true";
  return NextResponse.json({
    challengeId,
    canalMascarado: resolved.canalMascarado,
    ...(devEcho ? { devOtp: otp } : {}),
  });
}
