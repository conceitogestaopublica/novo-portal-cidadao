import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { getByIdDaConta } from "@/shared/repos/solicitacao-repo";

/** Detalhe de uma solicitação minha. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  if (!cidadao) return NextResponse.json({ message: "Sessão inválida" }, { status: 401 });
  const solicitacao = await getByIdDaConta(id, cidadao.id, tenant.municipio);
  if (!solicitacao) return NextResponse.json({ message: "Solicitação não encontrada." }, { status: 404 });
  return NextResponse.json({ solicitacao });
}
