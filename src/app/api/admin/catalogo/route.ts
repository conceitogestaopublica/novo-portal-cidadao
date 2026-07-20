import { NextResponse } from "next/server";
import { isAdmin } from "@/shared/lib/admin-session";
import { carregarCatalogoAdmin } from "@/shared/catalogo/catalogo-admin-repo";
import { currentTenant } from "@/shared/lib/tenant-map";

/** Catálogo completo para o admin (inclui serviços despublicados). */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  return NextResponse.json(await carregarCatalogoAdmin(tenant.municipio));
}
