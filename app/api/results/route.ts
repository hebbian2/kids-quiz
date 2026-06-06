import { NextResponse } from "next/server";
import { getResults, saveResult } from "@/lib/storage";
import { QuizResult } from "@/types/quiz";

export async function GET() {
  return NextResponse.json(await getResults());
}

export async function POST(req: Request) {
  const body = await req.json() as Omit<QuizResult, "id" | "submittedAt">;
  const result: QuizResult = {
    ...body,
    id: `result-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  await saveResult(result);
  return NextResponse.json(result, { status: 201 });
}
