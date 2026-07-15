import { NextResponse } from "next/server";
import { isAdmin } from "@/shared/lib/admin-session";
import { carregarCatalogoAdmin } from "@/shared/catalogo/catalogo-admin-repo";

/** Catálogo completo para o admin (inclui serviços despublicados). */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await carregarCatalogoAdmin());
}
