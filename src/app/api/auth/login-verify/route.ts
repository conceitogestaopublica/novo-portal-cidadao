import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { verificarDesafio } from "@/shared/lib/otp-store";
import { montarSessaoLogada } from "@/shared/lib/montar-sessao";
import { loginVerifySchema as schema } from "@/modules/auth/schemas/auth.schema";

/**
 * Passo 2 do login: valida o OTP, emite o JWT CONTRIBUINTE no tributário e cria
 * a sessão do portal (cookie httpOnly). O token de backend fica server-side.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const v = verificarDesafio(parsed.data.challengeId, parsed.data.otp.trim());
  if (!v.ok) {
    const msg =
      v.motivo === "expirado" ? "Código expirado. Recomece."
      : v.motivo === "bloqueado" ? "Muitas tentativas. Recomece."
      : "Código inválido.";
    return NextResponse.json({ message: msg }, { status: 401 });
  }

  try {
    await montarSessaoLogada({
      tenant,
      documento: v.documento,
      contribuinteId: v.contribuinteId,
      nome: v.nome,
    });
  } catch {
    return NextResponse.json({ message: "Falha ao autenticar. Tente novamente." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
