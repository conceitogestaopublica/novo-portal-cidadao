import { NextResponse } from "next/server";
import { z } from "zod";
import { senhaAdminValida, writeAdminSession } from "@/shared/lib/admin-session";

const schema = z.object({ senha: z.string().min(1) });

/** Login do admin da Carta de Serviços (senha `PORTAL_ADMIN_SENHA`). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Informe a senha." }, { status: 400 });

  if (!senhaAdminValida(parsed.data.senha)) {
    return NextResponse.json({ message: "Senha inválida." }, { status: 401 });
  }
  await writeAdminSession();
  return NextResponse.json({ ok: true });
}
