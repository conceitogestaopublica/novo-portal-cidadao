import { NextResponse } from "next/server";
import { readSession } from "@/shared/lib/portal-session";
import { currentTenant } from "@/shared/lib/tenant-map";
import type { MeResponse } from "@/shared/types/portal";

/** Sessão atual (conta + tenant). Nunca expõe tokens de backend. */
export async function GET() {
  const [session, tenant] = await Promise.all([readSession(), currentTenant()]);
  const body: MeResponse = {
    conta: session?.conta ?? null,
    tenant: tenant ? { municipio: tenant.municipio, nome: tenant.nome } : null,
  };
  return NextResponse.json(body);
}
