import { NextResponse } from "next/server";
import { senhaAdminValida, writeAdminSession } from "@/shared/lib/admin-session";
import { loginBloqueado, registrarFalha, registrarSucesso } from "@/shared/lib/admin-login-lock";
import { adminLoginSchema as schema } from "@/modules/admin/schemas/admin-login.schema";

function chaveCliente(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "global"
  );
}

/** Login do admin da Carta de Serviços (senha `PORTAL_ADMIN_SENHA`). */
export async function POST(req: Request) {
  const chave = chaveCliente(req);
  if (loginBloqueado(chave)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Informe a senha." }, { status: 400 });

  if (!senhaAdminValida(parsed.data.senha)) {
    registrarFalha(chave);
    return NextResponse.json({ message: "Senha inválida." }, { status: 401 });
  }
  registrarSucesso(chave);
  await writeAdminSession();
  return NextResponse.json({ ok: true });
}
