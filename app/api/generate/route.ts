import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai";

export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  try {
    const questions = await generateQuestions(prompt);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
