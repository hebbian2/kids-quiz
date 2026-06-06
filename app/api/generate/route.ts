import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai";

export async function POST(req: Request) {
  const { prompt, model } = await req.json() as { prompt: string; model?: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  try {
    const questions = await generateQuestions(prompt, model);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
