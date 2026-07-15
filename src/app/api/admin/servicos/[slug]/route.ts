import { NextResponse } from "next/server";
import { isAdmin } from "@/shared/lib/admin-session";
import { excluirServico } from "@/shared/catalogo/catalogo-admin-repo";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const { slug } = await params;
  await excluirServico(slug);
  return NextResponse.json({ ok: true });
}
