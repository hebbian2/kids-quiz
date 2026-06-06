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

  try {
    const graded = await Promise.all(
      questions.map(async (q) => {
        const ans = answers.find((a) => a.questionId === q.id);
        if (!ans?.answer?.trim()) {
          return { questionId: q.id, score: 0, feedback: "No answer provided." };
        }
        const result = await gradeEssay(q.question, q.rubric, q.maxPoints, ans.answer);
        return { questionId: q.id, ...result };
      })
    );
    return NextResponse.json({ graded });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Grading failed" }, { status: 500 });
  }
}
