"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Quiz } from "@/types/quiz";

const CATEGORY_COLORS: Record<string, string> = {
  English: "bg-cyan-200 text-cyan-900",
  Math:    "bg-pink-200 text-pink-900",
  PPKN:   "bg-orange-200 text-orange-900",
  Science: "bg-green-200 text-green-900",
  IPS:     "bg-blue-200 text-blue-900",
};

const CARD_COLORS = ["bg-yellow-300", "bg-pink-300", "bg-green-300", "bg-blue-300", "bg-orange-300", "bg-purple-300"];

export default function Home() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch("/api/quizzes/public")
      .then((r) => r.json())
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const categories = ["All", ...Array.from(new Set(quizzes.map((q) => q.category).filter(Boolean)))];
  const filtered = selectedCategory === "All" ? quizzes : quizzes.filter((q) => q.category === selectedCategory);

  return (
    <main className="flex flex-col items-center min-h-screen py-16 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Kids Quiz by Mama Diva</h1>
          <p className="text-gray-500 text-lg">Pick a quiz and show what you know!</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-20 text-lg font-semibold">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-6">No quizzes yet. Ask your teacher to create one!</p>
            <Link href="/admin">
              <button className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-yellow-500 transition">
                Go to Admin
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Category filter */}
            {categories.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                      selectedCategory === cat
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {filtered.map((quiz, idx) => (
                <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
                  <div className={`${CARD_COLORS[idx % CARD_COLORS.length]} rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:brightness-95 transition`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
                        {quiz.category && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[quiz.category] ?? "bg-white text-gray-700"}`}>
                            {quiz.category}
                          </span>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-gray-700 mb-1">{quiz.description}</p>
                      )}
                      <p className="text-xs text-gray-600 font-semibold">{quiz.questions.length} questions</p>
                      <p className="text-xs text-gray-500">By {(quiz as Quiz & { adminName?: string }).adminName ?? "Unknown"}</p>
                    </div>
                    <div className="text-3xl ml-4">➡️</div>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center shadow">
                  <p className="text-gray-400 font-semibold">No quizzes in this category.</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-10 text-center">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition font-semibold">
            Admin Panel
          </Link>
        </div>
      </div>
    </main>
  );
}
