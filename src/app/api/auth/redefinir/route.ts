import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  consumirTokenETrocarSenha,
  contaDoToken,
} from "@/shared/repos/senha-reset-repo";

const schema = z.object({
  token: z.string().min(10),
  senha: z.string().min(6),
});

/** O link é válido? Usado pela tela antes de mostrar o formulário. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const contaId = token ? await contaDoToken(token) : null;
  return NextResponse.json({ valido: Boolean(contaId) });
}

/**
 * Passo 2: troca a senha. O token é de uso único e a troca acontece na mesma
 * transação — o mesmo link não serve duas vezes.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);
  const ok = await consumirTokenETrocarSenha(parsed.data.token, senhaHash);

  if (!ok) {
    return NextResponse.json(
      { message: "Este link expirou ou já foi usado. Peça a recuperação de novo." },
      { status: 400 },
    );
  }

  // Não deixa logado de propósito: quem trocou a senha prova que sabe a senha
  // nova entrando com ela.
  return NextResponse.json({ ok: true });
}
