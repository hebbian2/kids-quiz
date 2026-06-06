import { NextResponse } from "next/server";
import { gradeEssay } from "@/lib/ai";
import { EssayQuestion, QuizAnswer } from "@/types/quiz";

export async function POST(req: Request) {
  const { question, answers } = await req.json() as {
    question: EssayQuestion;
    answers: { questionId: string; answer: string }[];
  };

  try {
    const result = await gradeEssay(
      question.question,
      question.rubric,
      question.maxPoints,
      answers[0].answer
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Grading failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { questions, answers } = await req.json() as {
    questions: EssayQuestion[];
    answers: QuizAnswer[];
  };

  const graded: { questionId: string; score: number; feedback: string }[] = [];

  for (const q of questions) {
    const ans = answers.find((a) => a.questionId === q.id);
    if (!ans?.answer?.trim()) {
      graded.push({ questionId: q.id, score: 0, feedback: "No answer provided." });
      continue;
    }
    try {
      const result = await gradeEssay(q.question, q.rubric, q.maxPoints, ans.answer);
      graded.push({ questionId: q.id, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[grade] question ${q.id}:`, msg);
      graded.push({ questionId: q.id, score: 0, feedback: "Could not grade this answer. Please ask your teacher to review it." });
    }
  }

  return NextResponse.json({ graded });
}
