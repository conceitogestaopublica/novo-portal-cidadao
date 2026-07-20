import { NextResponse } from "next/server";
import { isAdmin } from "@/shared/lib/admin-session";
import { excluirServico } from "@/shared/catalogo/catalogo-admin-repo";
import { currentTenant } from "@/shared/lib/tenant-map";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  const { slug } = await params;
  await excluirServico(tenant.municipio, slug);
  return NextResponse.json({ ok: true });
}
