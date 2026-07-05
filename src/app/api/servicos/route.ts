import { NextResponse } from "next/server";
import { listServicos } from "@/shared/catalogo/catalogo";

/** Busca de serviços (Carta de Serviços). Filtros: q, categoria, publico. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const res = await listServicos({
    q: sp.get("q") ?? undefined,
    categoria: sp.get("categoria") ?? undefined,
    publico: sp.get("publico") ?? undefined,
  });
  return NextResponse.json(res);
}
