import { NextResponse } from "next/server";
import { getAdminByCode } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { code } = await req.json() as { code: string };
    if (!code?.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    const admin = await getAdminByCode(code.trim().toUpperCase());
    if (!admin) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }
    const { code: _, ...safeAdmin } = admin;
    return NextResponse.json({ admin: safeAdmin });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/auth]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
