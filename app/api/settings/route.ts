import { NextResponse } from "next/server";
import { getSettings, saveSettings, getAdminByCode } from "@/lib/storage";
import { AppSettings } from "@/lib/storage";

async function getSuperAdmin(req: Request) {
  const code = req.headers.get("x-admin-code") ?? "";
  const admin = await getAdminByCode(code.toUpperCase());
  return admin?.role === "super-admin";
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json() as Partial<AppSettings>;
  const current = await getSettings();
  await saveSettings({ ...current, ...body });
  return NextResponse.json(await getSettings());
}
