import { NextResponse } from "next/server";
import { clearAdminSession } from "@/shared/lib/admin-session";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
