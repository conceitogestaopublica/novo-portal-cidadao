import { NextResponse } from "next/server";
import { writeAdminSession } from "@/shared/lib/admin-session";
import { loginBloqueado, registrarFalha, registrarSucesso } from "@/shared/lib/login-lock";
import { adminByEmail, verificarSenhaAdmin } from "@/shared/repos/portal-admin-repo";
import { adminLoginSchema as schema } from "@/modules/admin/schemas/admin-login.schema";

/**
 * Login do admin da Carta de Serviços (conta própria — `PortalAdmin`).
 *
 * Bloqueio por E-MAIL (não por IP): protege a CONTA visada, mesmo padrão do
 * login por senha do cidadão — rotacionar IP não ajuda quem ataca.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  if (await loginBloqueado("admin", email)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 },
    );
  }

  const admin = await adminByEmail(email);
  if (!admin || !(await verificarSenhaAdmin(admin, parsed.data.senha))) {
    await registrarFalha("admin", email);
    // Genérico (não revela se o e-mail tem conta).
    return NextResponse.json({ message: "E-mail ou senha inválidos." }, { status: 401 });
  }

  await registrarSucesso("admin", email);
  await writeAdminSession(admin);
  return NextResponse.json({ ok: true });
}
