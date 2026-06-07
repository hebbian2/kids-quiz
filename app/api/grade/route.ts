import { NextResponse } from "next/server";
import { gradeEssay } from "@/lib/ai";
import { getQuiz } from "@/lib/storage";
import { EssayQuestion, MultipleChoiceQuestion } from "@/types/quiz";

// Grade all questions (MCQ + essay) server-side so correctAnswer is never exposed
export async function PUT(req: Request) {
  const { quizId, answers } = await req.json() as {
    quizId: string;
    answers: { questionId: string; answer: string }[];
  };

  const quiz = await getQuiz(quizId);
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const graded: { questionId: string; score: number; feedback: string }[] = [];

  for (const q of quiz.questions) {
    const ans = answers.find((a) => a.questionId === q.id);

    if (q.type === "multiple-choice") {
      const mcq = q as MultipleChoiceQuestion;
      const userAnswer = ans?.answer ?? "";
      const correct = userAnswer === mcq.correctAnswer;
      const correctOption = mcq.options.find((o) => o.label === mcq.correctAnswer);
      graded.push({
        questionId: q.id,
        score: correct ? mcq.points : 0,
        feedback: correct
          ? "Correct!"
          : `Correct answer: ${mcq.correctAnswer.toUpperCase()}. ${correctOption?.text ?? ""}`,
      });
      continue;
    }

    const eq = q as EssayQuestion;
    if (!ans?.answer?.trim()) {
      graded.push({ questionId: q.id, score: 0, feedback: "No answer provided." });
      continue;
    }
    try {
      const result = await gradeEssay(eq.question, eq.rubric, eq.maxPoints, ans.answer);
      graded.push({ questionId: q.id, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[grade] question ${q.id}:`, msg);
      graded.push({ questionId: q.id, score: 0, feedback: "Could not grade this answer. Please ask your teacher to review it." });
    }
  }

  return NextResponse.json({ graded });
}
