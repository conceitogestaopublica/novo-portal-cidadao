import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/shared/lib/admin-session";
import { salvarAmbiente } from "@/shared/catalogo/catalogo-admin-repo";
import { currentTenant } from "@/shared/lib/tenant-map";

const schema = z.object({
  slug: z.string().optional().default(""),
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().default(""),
  icone: z.string().default("fas fa-folder-open"),
  cor: z.string().default("blue"),
  sistema: z.enum(["tributario", "ged", "gpe2"]).default("ged"),
  disponivel: z.boolean().default(true),
  ordem: z.number().int().optional(),
});

/** Cria/atualiza um ambiente. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { ordem, ...ambiente } = parsed.data;
  await salvarAmbiente(tenant.municipio, ambiente, ordem);
  return NextResponse.json({ ok: true });
}
