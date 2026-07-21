import { NextResponse } from "next/server";
import { isAdmin } from "@/shared/lib/admin-session";
import { salvarServico } from "@/shared/catalogo/catalogo-admin-repo";
import { currentTenant } from "@/shared/lib/tenant-map";
import { servicoSchema as schema } from "@/modules/admin/schemas/catalogo-admin.schema";

/** Cria/atualiza um serviço da Carta de Serviços. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { ordem, publicado, ...servico } = parsed.data;
  // Serviço fiscal exige uma ação; fora disso, zera o campo.
  const fiscal_acao = servico.tipo_fluxo === "self_service_fiscal" ? servico.fiscal_acao ?? null : null;
  await salvarServico(tenant.municipio, { ...servico, fiscal_acao, id: servico.id ?? servico.slug }, publicado, ordem);
  return NextResponse.json({ ok: true });
}
