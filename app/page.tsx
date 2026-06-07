"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Quiz } from "@/types/quiz";

type QuizWithMeta = Quiz & { adminName?: string; grade?: string };

const CATEGORY_COLORS: Record<string, string> = {
  English:            "bg-cyan-200 text-cyan-900",
  Math:               "bg-pink-200 text-pink-900",
  PPKN:               "bg-orange-200 text-orange-900",
  Science:            "bg-green-200 text-green-900",
  IPS:                "bg-blue-200 text-blue-900",
  "Bahasa Indonesia": "bg-red-200 text-red-900",
  "Other":            "bg-gray-200 text-gray-800",
};

const CARD_COLORS = ["bg-yellow-300", "bg-pink-300", "bg-green-300", "bg-blue-300", "bg-orange-300", "bg-purple-300"];

export default function Home() {
  const [quizzes, setQuizzes] = useState<QuizWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  function shareQuiz(e: React.MouseEvent, quizId: string) {
    e.preventDefault();
    const url = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(quizId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function loadQuizzes() {
    setLoading(true);
    fetch("/api/quizzes/public")
      .then((r) => r.json())
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/quizzes/public")
      .then((r) => r.json())
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(quizzes.map((q) => q.category).filter(Boolean)))];
  const grades = ["All", ...Array.from(new Set(quizzes.map((q) => q.grade).filter(Boolean))) as string[]];

  const filtered = quizzes
    .filter((q) => selectedCategory === "All" || q.category === selectedCategory)
    .filter((q) => selectedGrade === "All" || q.grade === selectedGrade)
    .filter((q) => {
      const s = search.toLowerCase();
      return !s || q.title.toLowerCase().includes(s) || q.description?.toLowerCase().includes(s);
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <main className="flex flex-col items-center min-h-screen py-16 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Kids Quiz by Mama Diva</h1>
          <p className="text-gray-500 text-lg">Pick a quiz and show what you know!</p>
        </div>

        {/* Search + Reload */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-yellow-400 text-black"
          />
          <button
            onClick={loadQuizzes}
            disabled={loading}
            className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
          >
            {loading ? "..." : "↻"}
          </button>
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
              <div className="flex gap-2 flex-wrap mb-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => changeFilter(setSelectedCategory, cat)}
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

            {/* Grade filter */}
            {grades.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {grades.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => changeFilter(setSelectedGrade, grade)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                      selectedGrade === grade
                        ? "bg-violet-700 text-white"
                        : "bg-violet-100 text-violet-800 hover:bg-violet-200"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {paginated.map((quiz, idx) => (
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
                        {quiz.grade && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                            {quiz.grade}
                          </span>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-gray-700 mb-1">{quiz.description}</p>
                      )}
                      <p className="text-xs text-gray-600 font-semibold">{quiz.questions.length} questions</p>
                      <p className="text-xs text-gray-500">By {quiz.adminName ?? "Unknown"}</p>
                      <p className="text-xs text-gray-400">{new Date(quiz.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 ml-4 shrink-0">
                      <div className="text-3xl">➡️</div>
                      <button
                        onClick={(e) => shareQuiz(e, quiz.id)}
                        className="text-xs font-bold px-3 py-1 rounded-full bg-white/70 hover:bg-white transition"
                      >
                        {copiedId === quiz.id ? "Copied!" : "Share"}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center shadow">
                  <p className="text-gray-400 font-semibold">
                    {search ? `No quizzes matching "${search}"` : "No quizzes found."}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition ${
                      page === p
                        ? "bg-gray-800 text-white"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
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
