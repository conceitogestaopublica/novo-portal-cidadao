import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/shared/lib/admin-session";
import { salvarCategoria } from "@/shared/catalogo/catalogo-admin-repo";

const schema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  slug: z.string().optional().default(""),
  ambienteSlug: z.string().min(1, "Escolha o ambiente"),
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().default(""),
  icone: z.string().default("fas fa-folder"),
  cor: z.string().default("blue"),
  ordem: z.number().int().optional(),
});

/** Cria/atualiza uma categoria. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { ordem, ...cat } = parsed.data;
  await salvarCategoria({ ...cat, id: cat.id ?? cat.slug }, ordem);
  return NextResponse.json({ ok: true });
}
