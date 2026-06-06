import { NextResponse } from "next/server";
import { getQuizzesWithAdminName } from "@/lib/storage";

export async function GET() {
  try {
    const quizzes = await getQuizzesWithAdminName();
    return NextResponse.json(quizzes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/quizzes/public]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
