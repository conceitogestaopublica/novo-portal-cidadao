import { NextResponse } from "next/server";
import { listServicos } from "@/shared/catalogo/catalogo";
import { currentTenant } from "@/shared/lib/tenant-map";

/** Busca de serviços (Carta de Serviços). Filtros: q, categoria, publico. */
export async function GET(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });
  const sp = new URL(req.url).searchParams;
  const res = await listServicos(tenant.municipio, {
    q: sp.get("q") ?? undefined,
    categoria: sp.get("categoria") ?? undefined,
    publico: sp.get("publico") ?? undefined,
  });
  return NextResponse.json(res);
}
