import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";
import { verificarDesafio } from "@/shared/lib/otp-store";
import { writeSession } from "@/shared/lib/portal-session";

const schema = z.object({
  challengeId: z.string().min(1),
  otp: z.string().min(4).max(8),
});

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

  const adapter = new TributarioAdapter(tenant);
  let tokenRes;
  try {
    tokenRes = await adapter.emitirToken(v.contribuinteId);
  } catch {
    return NextResponse.json({ message: "Falha ao autenticar. Tente novamente." }, { status: 502 });
  }

  await writeSession({
    conta: { id: v.contribuinteId, nome: v.nome },
    municipio: tenant.municipio,
    tributarioToken: tokenRes.accessToken,
    tributarioTokenExp: Math.floor(Date.now() / 1000) + (tokenRes.expiresIn ?? 900),
  });

  return NextResponse.json({ ok: true });
}
