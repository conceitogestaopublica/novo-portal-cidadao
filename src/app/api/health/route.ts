import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

/**
 * Healthcheck do container (Docker `HEALTHCHECK`/orquestrador). Confere só o
 * processo Node + o banco PRÓPRIO do portal — nunca os backends externos
 * (tributário/GED/gpe2): eles já degradam graciosamente nas telas que os usam,
 * e não devem derrubar o healthcheck do portal quando estão fora do ar.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
