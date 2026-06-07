"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Quiz, QuizAnswer, MultipleChoiceQuestion, EssayQuestion } from "@/types/quiz";

type Step = "name" | "quiz" | "grading" | "result";

interface GradedAnswer extends QuizAnswer {
  feedback?: string;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [step, setStep] = useState<Step>("name");
  const [studentName, setStudentName] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gradedAnswers, setGradedAnswers] = useState<GradedAnswer[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((r) => r.json())
      .then(setQuiz);
  }, [id]);

  if (!quiz) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 text-xl">Loading quiz...</div>
    </div>
  );

  const questions = quiz.questions;
  const currentQ = questions[current];

  function handleAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));
  }

  function goNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    }
  }

  function goPrev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  async function handleSubmit() {
    setStep("grading");
    setError("");

    const allAnswers: { questionId: string; answer: string }[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    const gradedMap: Record<string, { score: number; feedback: string }> = {};
    try {
      const res = await fetch("/api/grade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz!.id, answers: allAnswers }),
      });
      const data = await res.json() as { graded: { questionId: string; score: number; feedback: string }[] };
      for (const g of data.graded) {
        gradedMap[g.questionId] = { score: g.score, feedback: g.feedback };
      }
    } catch {
      setError("Grading failed. Some scores may show as 0.");
    }

    const gradedAnswers: GradedAnswer[] = questions.map((q) => {
      const grade = gradedMap[q.id] ?? { score: 0, feedback: "Could not grade." };
      return {
        questionId: q.id,
        type: q.type,
        answer: answers[q.id] ?? "",
        score: grade.score,
        feedback: grade.feedback,
      };
    });

    const total = gradedAnswers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const max = questions.reduce((sum, q) => {
      return sum + (q.type === "multiple-choice" ? (q as MultipleChoiceQuestion).points : (q as EssayQuestion).maxPoints);
    }, 0);

    await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: quiz!.id,
        studentName,
        answers: gradedAnswers,
        totalScore: total,
        maxScore: max,
        percentage: max > 0 ? Math.round((total / max) * 100) : 0,
      }),
    });

    setGradedAnswers(gradedAnswers);
    setTotalScore(total);
    setMaxScore(max);
    setStep("result");
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const emoji =
    percentage >= 90 ? "🏆" :
    percentage >= 70 ? "🌟" :
    percentage >= 50 ? "👍" : "💪";

  const message =
    percentage >= 90 ? "Outstanding!" :
    percentage >= 70 ? "Great job!" :
    percentage >= 50 ? "Good effort!" : "Keep practicing!";

  if (step === "name") {
    return (
      <main className="flex items-center justify-center min-h-screen px-4 bg-amber-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-500 mb-6">{quiz.description}</p>}
          <p className="text-gray-400 text-sm mb-6">{questions.length} questions</p>
          <input
            type="text"
            placeholder="Your name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            maxLength={30}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-yellow-400 mb-2 text-black"
            onKeyDown={(e) => e.key === "Enter" && studentName.trim() && setStep("quiz")}
          />
          <p className="text-xs text-gray-400 text-right mb-4">{studentName.length}/30</p>
          <button
            onClick={() => setStep("quiz")}
            disabled={!studentName.trim()}
            className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold text-lg hover:bg-yellow-500 transition disabled:opacity-40"
          >
            Start Quiz!
          </button>
        </div>
      </main>
    );
  }

  if (step === "grading") {
    return (
      <main className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🤖</div>
          <p className="text-xl text-gray-700 font-semibold">Grading your answers...</p>
          <p className="text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </main>
    );
  }

  if (step === "result") {
    return (
      <main className="flex items-center justify-center min-h-screen px-4 py-10 bg-amber-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">{emoji}</div>
            <h2 className="text-3xl font-bold text-gray-800">{message}</h2>
            <p className="text-gray-500 mt-1">Well done, {studentName}!</p>
            <div className="mt-4 text-5xl font-bold text-gray-800">{percentage}%</div>
            <p className="text-gray-400">{totalScore} / {maxScore} points</p>
            {error && <p className="text-orange-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex flex-col gap-4 mb-8">
            {questions.map((q, i) => {
              const ga = gradedAnswers.find((a) => a.questionId === q.id);
              const isCorrect = (ga?.score ?? 0) > 0;
              return (
                <div key={q.id} className={`rounded-xl p-4 ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                  <p className="font-semibold text-gray-700 text-sm mb-1">Q{i + 1}: {q.question}</p>
                  <p className="text-gray-600 text-sm">Your answer: <span className="font-medium">
                    {ga?.answer
                      ? q.type === "multiple-choice"
                        ? `${ga.answer.toUpperCase()}. ${(q as MultipleChoiceQuestion).options.find(o => o.label === ga.answer)?.text ?? ""}`
                        : ga.answer
                      : "(no answer)"}
                  </span></p>
                  {ga?.feedback && <p className="text-sm mt-1 text-gray-500 italic">{ga.feedback}</p>}
                  <p className="text-sm font-bold mt-1 text-right">
                    {ga?.score ?? 0} / {q.type === "multiple-choice" ? q.points : q.maxPoints} pts
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => {
                setStep("name");
                setCurrent(0);
                setAnswers({});
                setStudentName("");
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Quiz step
  const progress = Math.round(((current + 1) / questions.length) * 100);

  return (
    <main className="flex items-center justify-center min-h-screen px-4 py-10 bg-amber-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 font-medium">Question {current + 1} of {questions.length}</span>
          <span className="text-sm text-gray-600 font-semibold">{studentName}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
          <div
            className="bg-yellow-400 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">{currentQ.question}</h2>

        {/* Multiple choice */}
        {currentQ.type === "multiple-choice" && (
          <div className="flex flex-col gap-3">
            {(currentQ as MultipleChoiceQuestion).options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.label)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium
                  ${answers[currentQ.id] === opt.label
                    ? "bg-yellow-300 text-gray-900"
                    : "bg-gray-100 hover:bg-yellow-100 text-gray-700"}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                  ${answers[currentQ.id] === opt.label ? "bg-yellow-500 text-white" : "bg-white text-gray-500"}`}>
                  {opt.label.toUpperCase()}
                </span>
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Essay */}
        {currentQ.type === "essay" && (
          <textarea
            value={answers[currentQ.id] ?? ""}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={6}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-black resize-none"
          />
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {current > 0 && (
            <button
              onClick={goPrev}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Back
            </button>
          )}
          {current < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-400 text-gray-900 py-3 rounded-xl font-bold hover:bg-green-500 transition"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
