import { NextResponse } from "next/server";
import { clearSession } from "@/shared/lib/portal-session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
