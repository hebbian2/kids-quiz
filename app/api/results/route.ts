import { NextResponse } from "next/server";
import { getResults, saveResult, getAdminByCode, getQuizzes } from "@/lib/storage";
import { QuizResult } from "@/types/quiz";

export async function GET(req: Request) {
  const code = req.headers.get("x-admin-code") ?? "";
  const admin = code ? await getAdminByCode(code.toUpperCase()) : null;

  const results = await getResults();

  if (admin && admin.role !== "super-admin") {
    const adminQuizIds = new Set((await getQuizzes(admin.id)).map((q) => q.id));
    return NextResponse.json(results.filter((r) => adminQuizIds.has(r.quizId)));
  }

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const body = await req.json() as Omit<QuizResult, "id" | "submittedAt" | "ipAddress">;
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? undefined);
  const result: QuizResult = {
    ...body,
    id: `result-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    ipAddress,
  };
  await saveResult(result);
  return NextResponse.json(result, { status: 201 });
}
