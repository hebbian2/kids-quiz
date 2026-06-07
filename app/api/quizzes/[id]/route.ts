import { NextResponse } from "next/server";
import { getQuiz, saveQuiz, deleteQuiz, getAdminByCode } from "@/lib/storage";
import { Quiz, MultipleChoiceQuestion } from "@/types/quiz";

function stripAnswers(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.map((q) => {
      if (q.type !== "multiple-choice") return q;
      const { correctAnswer: _, ...rest } = q as MultipleChoiceQuestion;
      void _;
      return rest as MultipleChoiceQuestion;
    }),
  };
}

async function getAdmin(req: Request) {
  const code = req.headers.get("x-admin-code") ?? "";
  return getAdminByCode(code.toUpperCase());
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Admins can see the full quiz (for editing); students get answers stripped
  const code = req.headers.get("x-admin-code") ?? "";
  const admin = code ? await getAdminByCode(code.toUpperCase()) : null;
  return NextResponse.json(admin ? quiz : stripAnswers(quiz));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getQuiz(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (admin.role !== "super-admin" && existing.adminId !== admin.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json() as Quiz;
  await saveQuiz({ ...body, id, adminId: existing.adminId });
  return NextResponse.json({ ...body, id, adminId: existing.adminId });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getQuiz(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (admin.role !== "super-admin" && existing.adminId !== admin.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteQuiz(id);
  return NextResponse.json({ ok: true });
}
