import { NextResponse } from "next/server";
import { getQuizzesWithAdminName, saveQuiz, getAdminByCode } from "@/lib/storage";
import { Quiz } from "@/types/quiz";

async function getAdmin(req: Request) {
  const code = req.headers.get("x-admin-code") ?? "";
  return getAdminByCode(code.toUpperCase());
}

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const quizzes = admin.role === "super-admin"
    ? await getQuizzesWithAdminName()
    : await getQuizzesWithAdminName(admin.id);
  return NextResponse.json(quizzes);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as Omit<Quiz, "id" | "createdAt" | "adminId">;
  const quiz: Quiz = {
    ...body,
    id: `quiz-${Date.now()}`,
    createdAt: new Date().toISOString(),
    adminId: admin.id,
  };
  await saveQuiz(quiz);
  return NextResponse.json(quiz, { status: 201 });
}
