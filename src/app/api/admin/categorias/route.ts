import { NextResponse } from "next/server";
import { isAdmin } from "@/shared/lib/admin-session";
import { salvarCategoria } from "@/shared/catalogo/catalogo-admin-repo";
import { currentTenant } from "@/shared/lib/tenant-map";
import { categoriaSchema as schema } from "@/modules/admin/schemas/catalogo-admin.schema";

/** Cria/atualiza uma categoria. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { ordem, ...cat } = parsed.data;
  await salvarCategoria(tenant.municipio, { ...cat, id: cat.id ?? cat.slug }, ordem);
  return NextResponse.json({ ok: true });
}
