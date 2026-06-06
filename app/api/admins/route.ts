import { NextResponse } from "next/server";
import { getAdmins, getAdminByCode, saveAdmin, deleteAdmin } from "@/lib/storage";
import { Admin } from "@/types/quiz";

async function getSuperAdmin(req: Request): Promise<boolean> {
  const code = req.headers.get("x-admin-code") ?? "";
  const admin = await getAdminByCode(code.toUpperCase());
  return admin?.role === "super-admin";
}

export async function GET(req: Request) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admins = (await getAdmins()).map(({ code: _, ...a }) => a);
  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { name, code, role } = await req.json() as { name: string; code: string; role: string };
  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
  }
  const normalized = code.trim().toUpperCase();
  const existing = await getAdminByCode(normalized);
  if (existing) {
    return NextResponse.json({ error: "Code already in use" }, { status: 409 });
  }
  const admin: Admin = {
    id: `admin-${Date.now()}`,
    name: name.trim(),
    code: normalized,
    role: role === "super-admin" ? "super-admin" : "admin",
    createdAt: new Date().toISOString(),
  };
  await saveAdmin(admin);
  const { code: _, ...safeAdmin } = admin;
  return NextResponse.json(safeAdmin, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!await getSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await req.json() as { id: string };
  const admins = await getAdmins();
  const target = admins.find((a) => a.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "super-admin" && admins.filter((a) => a.role === "super-admin").length <= 1) {
    return NextResponse.json({ error: "Cannot delete the last super admin" }, { status: 400 });
  }
  await deleteAdmin(id);
  return NextResponse.json({ ok: true });
}
