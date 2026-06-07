"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Quiz, Question, MultipleChoiceQuestion, EssayQuestion } from "@/types/quiz";
import { GEMINI_MODELS } from "@/lib/ai";

type AdminTab = "quizzes" | "editor" | "results" | "admins" | "settings";

interface AdminUser {
  id: string;
  name: string;
  role: "admin" | "super-admin";
  createdAt: string;
}

interface QuizAnswer {
  questionId: string;
  type: string;
  answer: string;
  score?: number;
  feedback?: string;
}

interface QuizResult {
  id: string;
  quizId: string;
  studentName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  ipAddress?: string;
  answers?: QuizAnswer[];
}

const QUIZ_GRADES = [
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
];

const QUIZ_CATEGORIES = [
  "English",
  "Math",
  "PPKN",
  "Science",
  "IPS",
  "Bahasa Indonesia",
  "Other",
];

// ─── Login Screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (admin: AdminUser, code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as { admin?: AdminUser; error?: string };
      if (!res.ok || !data.admin) {
        setError(data.error ?? "Invalid code");
      } else {
        onLogin(data.admin, code.trim().toUpperCase());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-amber-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Access</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your admin code to continue</p>
        <input
          type="text"
          placeholder="Enter access code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-yellow-400 mb-4 text-black"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || !code.trim()}
          className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold text-lg hover:bg-yellow-500 transition disabled:opacity-40"
        >
          {loading ? "Verifying..." : "Login"}
        </button>
        <Link href="/" className="block mt-4 text-sm text-gray-400 hover:text-purple-500">
          Back to Student View
        </Link>
      </div>
    </main>
  );
}

// ─── Admin Management (super admin only) ─────────────────────────────────────

function AdminManagement({ adminCode }: { adminCode: string }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "super-admin">("admin");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    fetch("/api/admins", { headers: { "x-admin-code": adminCode } })
      .then((r) => r.json())
      .then(setAdmins);
  }

  useEffect(() => { load(); }, []);

  async function createAdmin() {
    if (!newName.trim() || !newCode.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
      body: JSON.stringify({ name: newName, code: newCode, role: newRole }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to create admin");
    } else {
      setSuccess(`Admin "${newName}" created with code "${newCode.toUpperCase()}"`);
      setNewName("");
      setNewCode("");
      setNewRole("admin");
      load();
    }
    setCreating(false);
  }

  async function removeAdmin(id: string, name: string) {
    if (!confirm(`Remove admin "${name}"?`)) return;
    await fetch("/api/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Create New Admin</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Admin name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-black"
          />
          <input
            type="text"
            placeholder="Access code (e.g. TEACHER01)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-yellow-400 text-black"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "admin" | "super-admin")}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-black"
          >
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm font-medium">{success}</p>}
          <button
            onClick={createAdmin}
            disabled={creating || !newName.trim() || !newCode.trim()}
            className="bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold hover:bg-yellow-500 transition disabled:opacity-40"
          >
            {creating ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {admins.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800">{a.name}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.role === "super-admin" ? "bg-yellow-300 text-gray-800" : "bg-blue-200 text-blue-900"}`}>
                {a.role === "super-admin" ? "Super Admin" : "Admin"}
              </span>
            </div>
            {a.role !== "super-admin" && (
              <button
                onClick={() => removeAdmin(a.id, a.name)}
                className="text-sm px-4 py-2 rounded-full bg-red-300 text-red-900 font-semibold hover:bg-red-400 transition"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminCode, setAdminCode] = useState("");
  const [tab, setTab] = useState<AdminTab>("quizzes");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const [resultsPage, setResultsPage] = useState(1);
  const RESULTS_PER_PAGE = 10;
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("gemini-flash-latest");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [saving, setSaving] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adminSession");
    if (saved) {
      try {
        const { admin: a, code } = JSON.parse(saved) as { admin: AdminUser; code: string };
        setAdmin(a);
        setAdminCode(code);
      } catch {
        localStorage.removeItem("adminSession");
      }
    }
  }, []);

  function handleLogin(a: AdminUser, code: string) {
    setAdmin(a);
    setAdminCode(code);
    localStorage.setItem("adminSession", JSON.stringify({ admin: a, code }));
  }

  function handleLogout() {
    setAdmin(null);
    setAdminCode("");
    localStorage.removeItem("adminSession");
  }

  function authHeaders() {
    return { "x-admin-code": adminCode };
  }

  function loadData() {
    fetch("/api/quizzes", { headers: authHeaders() })
      .then((r) => r.json())
      .then(setQuizzes);
    fetch("/api/results", { headers: authHeaders() }).then((r) => r.json()).then(setResults);
  }

  useEffect(() => {
    if (admin) {
      loadData();
      fetch("/api/settings")
        .then((r) => r.json())
        .then((s) => { if (s.defaultModel) setAiModel(s.defaultModel); });
    }
  }, [admin]);

  function newQuiz() {
    setEditingQuiz({ title: "", description: "", category: "", questions: [] });
    setTab("editor");
  }

  function editQuiz(quiz: Quiz) {
    setEditingQuiz({ ...quiz, questions: JSON.parse(JSON.stringify(quiz.questions)) });
    setTab("editor");
  }

  async function deleteQuizHandler(id: string) {
    if (!confirm("Delete this quiz?")) return;
    await fetch(`/api/quizzes/${id}`, { method: "DELETE", headers: authHeaders() });
    loadData();
  }

  async function generateQuestions() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiStatus("Sending request to AI...");
    try {
      setAiStatus("AI is generating questions, please wait...");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, model: aiModel }),
      });
      setAiStatus("Processing response...");
      const data = await res.json() as { questions?: Question[]; error?: string };
      if (data.error) { setAiError(data.error); setAiStatus(""); return; }
      setEditingQuiz((prev) => ({
        ...prev,
        questions: [...(prev?.questions ?? []), ...(data.questions ?? [])],
      }));
      setAiStatus(`Done! ${data.questions?.length ?? 0} questions added.`);
      setAiPrompt("");
      setTimeout(() => setAiStatus(""), 3000);
    } catch {
      setAiError("Failed to generate questions. Check your API key.");
      setAiStatus("");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveQuiz() {
    if (!editingQuiz?.title?.trim()) return;
    setSaving(true);
    const method = editingQuiz.id ? "PUT" : "POST";
    const url = editingQuiz.id ? `/api/quizzes/${editingQuiz.id}` : "/api/quizzes";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(editingQuiz),
    });
    setSaving(false);
    loadData();
    setTab("quizzes");
    setEditingQuiz(null);
  }

  function updateQuestion(index: number, updated: Question) {
    setEditingQuiz((prev) => {
      const qs = [...(prev?.questions ?? [])];
      qs[index] = updated;
      return { ...prev, questions: qs };
    });
  }

  function removeQuestion(index: number) {
    setEditingQuiz((prev) => ({
      ...prev,
      questions: (prev?.questions ?? []).filter((_, i) => i !== index),
    }));
  }

  function addEmptyMCQ() {
    const newQ: MultipleChoiceQuestion = {
      id: `q-${Date.now()}`,
      type: "multiple-choice",
      question: "",
      options: [
        { label: "a", text: "" },
        { label: "b", text: "" },
        { label: "c", text: "" },
        { label: "d", text: "" },
      ],
      correctAnswer: "a",
      points: 10,
    };
    setEditingQuiz((prev) => ({ ...prev, questions: [...(prev?.questions ?? []), newQ] }));
  }

  function addEmptyEssay() {
    const newQ: EssayQuestion = {
      id: `q-${Date.now()}`,
      type: "essay",
      question: "",
      rubric: "",
      maxPoints: 20,
    };
    setEditingQuiz((prev) => ({ ...prev, questions: [...(prev?.questions ?? []), newQ] }));
  }

  if (!admin) return <LoginScreen onLogin={handleLogin} />;

  const quizResultsMap = results.reduce<Record<string, QuizResult[]>>((acc, r) => {
    acc[r.quizId] = [...(acc[r.quizId] ?? []), r];
    return acc;
  }, {});

  const tabs: AdminTab[] = admin.role === "super-admin"
    ? ["quizzes", "results", "admins", "settings"]
    : ["quizzes", "results", "settings"];

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-700">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">
              Logged in as <span className="font-semibold text-gray-600">{admin.name}</span>
              {admin.role === "super-admin" && (
                <span className="ml-2 text-xs bg-yellow-300 text-gray-800 px-2 py-0.5 rounded-full font-semibold">Super Admin</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:underline font-semibold">Student View</Link>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition font-semibold">Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition capitalize
                ${tab === t ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              {t === "admins" ? "Manage Admins" : t}
            </button>
          ))}
          {editingQuiz && (
            <button
              onClick={() => setTab("editor")}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition
                ${tab === "editor" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              {editingQuiz.id ? "Edit Quiz" : "New Quiz"}
            </button>
          )}
        </div>

        {/* Quizzes Tab */}
        {tab === "quizzes" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">
                {admin.role === "super-admin" ? "All Quizzes" : "My Quizzes"}
              </h2>
              <button
                onClick={newQuiz}
                className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-full font-semibold hover:bg-yellow-500 transition text-sm"
              >
                + New Quiz
              </button>
            </div>
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow">
                <p className="text-gray-400">No quizzes yet. Create one!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-800">{quiz.title}</h3>
                        {quiz.category && (
                          <span className="text-xs bg-cyan-200 text-cyan-900 px-2 py-0.5 rounded-full font-semibold">{quiz.category}</span>
                        )}
                        {quiz.grade && (
                          <span className="text-xs bg-violet-200 text-violet-900 px-2 py-0.5 rounded-full font-semibold">{quiz.grade}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {quiz.questions.length} questions · {quizResultsMap[quiz.id]?.length ?? 0} submissions
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Created by {(quiz as Quiz & { adminName?: string }).adminName ?? "Unknown"} · {new Date(quiz.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/quiz/${quiz.id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedId(quiz.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-sm px-4 py-2 rounded-full bg-green-300 text-green-900 font-semibold hover:bg-green-400 transition"
                      >
                        {copiedId === quiz.id ? "Copied!" : "Share"}
                      </button>
                      <Link
                        href={`/quiz/${quiz.id}`}
                        className="text-sm px-4 py-2 rounded-full bg-blue-200 text-blue-900 font-semibold hover:bg-blue-300 transition"
                      >
                        Preview
                      </Link>
                      <button
                        onClick={() => editQuiz(quiz)}
                        className="text-sm px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteQuizHandler(quiz.id)}
                        className="text-sm px-4 py-2 rounded-full bg-red-300 text-red-900 font-semibold hover:bg-red-400 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {tab === "results" && (() => {
          const sorted = [...results].reverse();
          const totalPages = Math.ceil(sorted.length / RESULTS_PER_PAGE);
          const paginated = sorted.slice((resultsPage - 1) * RESULTS_PER_PAGE, resultsPage * RESULTS_PER_PAGE);
          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-700">Student Results</h2>
                {results.length > 0 && (
                  <p className="text-sm text-gray-400">{results.length} total</p>
                )}
              </div>
              {results.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow">
                  <p className="text-gray-400">No results yet.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 mb-4">
                    {paginated.map((r) => {
                      const quiz = quizzes.find((q) => q.id === r.quizId);
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedResult(r)}
                          className="bg-white rounded-2xl shadow p-5 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition"
                        >
                          <div>
                            <p className="font-bold text-gray-800">{r.studentName}</p>
                            {r.ipAddress && <p className="text-xs text-gray-400 font-mono">{r.ipAddress}</p>}
                            <p className="text-sm text-gray-400">{quiz?.title ?? "Unknown quiz"}</p>
                            <p className="text-xs text-gray-300 mt-1">{new Date(r.submittedAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${r.percentage >= 70 ? "text-green-500" : r.percentage >= 50 ? "text-yellow-500" : "text-red-400"}`}>
                                {r.percentage}%
                              </div>
                              <p className="text-xs text-gray-400">{r.totalScore} / {r.maxScore} pts</p>
                            </div>
                            <span className="text-gray-300 text-lg">›</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setResultsPage((p) => Math.max(1, p - 1))}
                        disabled={resultsPage === 1}
                        className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition disabled:opacity-40 text-sm"
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setResultsPage(page)}
                          className={`w-9 h-9 rounded-xl font-bold text-sm transition ${
                            page === resultsPage
                              ? "bg-gray-800 text-white"
                              : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setResultsPage((p) => Math.min(totalPages, p + 1))}
                        disabled={resultsPage === totalPages}
                        className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition disabled:opacity-40 text-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* Result Detail Modal */}
        {selectedResult && (
          <ResultDetailModal
            result={selectedResult}
            quiz={quizzes.find((q) => q.id === selectedResult.quizId) ?? null}
            onClose={() => setSelectedResult(null)}
          />
        )}

        {/* Admin Management Tab (super admin only) */}
        {tab === "admins" && admin.role === "super-admin" && (
          <AdminManagement adminCode={adminCode} />
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <SettingsPanel
            adminCode={adminCode}
            currentModel={aiModel}
            onModelChange={setAiModel}
          />
        )}

        {/* Editor Tab */}
        {tab === "editor" && editingQuiz && (
          <div>
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Quiz Details</h2>
              <input
                type="text"
                placeholder="Quiz title *"
                value={editingQuiz.title ?? ""}
                onChange={(e) => setEditingQuiz((p) => ({ ...p, title: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-purple-400 text-black"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={editingQuiz.description ?? ""}
                onChange={(e) => setEditingQuiz((p) => ({ ...p, description: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-purple-400 text-black"
              />
              <select
                value={editingQuiz.category ?? ""}
                onChange={(e) => setEditingQuiz((p) => ({ ...p, category: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-black bg-white h-14 appearance-none"
              >
                <option value="" disabled>Select category *</option>
                {QUIZ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={editingQuiz.grade ?? ""}
                onChange={(e) => setEditingQuiz((p) => ({ ...p, grade: e.target.value || undefined }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-black bg-white h-14 appearance-none mt-3"
              >
                <option value="">Select grade (optional)</option>
                {QUIZ_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* AI Generator */}
            <div className="bg-violet-100 rounded-2xl border-2 border-violet-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className="font-bold text-violet-700 text-lg">Generate with AI</h3>
              </div>
              <p className="text-gray-500 text-sm mb-3">Describe what questions you want. Example: "5 math questions about fractions for grade 3" or "3 questions about dinosaurs with one essay"</p>
              <div className="flex gap-2">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the questions you want..."
                  rows={2}
                  className="flex-1 border-2 border-violet-200 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-400 resize-none text-sm text-black bg-white"
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) generateQuestions(); }}
                />
                <button
                  onClick={generateQuestions}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="bg-violet-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-violet-600 transition disabled:opacity-40 text-sm whitespace-nowrap"
                >
                  {aiLoading ? "Generating..." : "Generate"}
                </button>
              </div>
              {aiLoading && (
                <div className="mt-3 flex items-center gap-2 text-violet-700 text-sm bg-violet-50 rounded-xl px-4 py-3">
                  <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>{aiStatus}</span>
                </div>
              )}
              {!aiLoading && aiStatus && (
                <p className="text-green-600 text-sm mt-2 font-medium">{aiStatus}</p>
              )}
              {aiError && <p className="text-red-500 text-sm mt-2">{aiError}</p>}
            </div>

            {/* Questions */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-700">Questions ({editingQuiz.questions?.length ?? 0})</h2>
              <div className="flex gap-2">
                <button onClick={addEmptyMCQ} className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold hover:bg-blue-200 transition">+ Multiple Choice</button>
                <button onClick={addEmptyEssay} className="text-sm bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold hover:bg-green-200 transition">+ Essay</button>
              </div>
            </div>

            {(editingQuiz.questions ?? []).length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center shadow text-gray-400 mb-6">
                No questions yet. Generate with AI or add manually.
              </div>
            )}

            <div className="flex flex-col gap-4 mb-6">
              {(editingQuiz.questions ?? []).map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  index={i}
                  question={q}
                  onChange={(updated) => updateQuestion(i, updated)}
                  onRemove={() => removeQuestion(i)}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveQuiz}
                disabled={saving || !editingQuiz.title?.trim() || !editingQuiz.category}
                className="flex-1 bg-green-400 text-gray-900 py-3 rounded-xl font-bold hover:bg-green-500 transition disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Quiz"}
              </button>
              <button
                onClick={() => { setTab("quizzes"); setEditingQuiz(null); }}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({
  index,
  question,
  onChange,
  onRemove,
}: {
  index: number;
  question: Question;
  onChange: (q: Question) => void;
  onRemove: () => void;
}) {
  if (question.type === "multiple-choice") {
    const q = question as MultipleChoiceQuestion;
    const labels = ["a", "b", "c", "d", "e"];

    function updateOption(label: string, text: string) {
      onChange({ ...q, options: q.options.map((o) => o.label === label ? { ...o, text } : o) });
    }

    function addOption() {
      if (q.options.length >= 5) return;
      const nextLabel = labels[q.options.length];
      onChange({ ...q, options: [...q.options, { label: nextLabel, text: "" }] });
    }

    function removeOption(label: string) {
      if (q.options.length <= 2) return;
      const newOptions = q.options.filter((o) => o.label !== label);
      const newCorrect = newOptions.some((o) => o.label === q.correctAnswer) ? q.correctAnswer : newOptions[0].label;
      onChange({ ...q, options: newOptions, correctAnswer: newCorrect });
    }

    return (
      <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-blue-400">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Q{index + 1} · Multiple Choice</span>
          <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm font-bold">Remove</button>
        </div>
        <input
          type="text"
          placeholder="Question text"
          value={q.question}
          onChange={(e) => onChange({ ...q, question: e.target.value })}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:border-blue-300 text-sm text-black"
        />
        <div className="flex flex-col gap-2 mb-3">
          {q.options.map((opt) => (
            <div key={opt.label} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={q.correctAnswer === opt.label}
                onChange={() => onChange({ ...q, correctAnswer: opt.label })}
                className="accent-blue-500"
                title="Mark as correct answer"
              />
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {opt.label.toUpperCase()}
              </span>
              <input
                type="text"
                placeholder={`Option ${opt.label.toUpperCase()}`}
                value={opt.text}
                onChange={(e) => updateOption(opt.label, e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 text-sm text-black"
              />
              {q.options.length > 2 && (
                <button onClick={() => removeOption(opt.label)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {q.options.length < 5 && (
            <button onClick={addOption} className="text-xs text-blue-600 hover:underline">+ Add option</button>
          )}
          <label className="text-xs text-gray-500 ml-auto flex items-center gap-1">
            Points:
            <input
              type="number"
              min={1}
              value={q.points}
              onChange={(e) => onChange({ ...q, points: Number(e.target.value) })}
              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-300 text-sm text-black"
            />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">Radio button = correct answer</p>
      </div>
    );
  }

  const q = question as EssayQuestion;
  return (
    <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-green-400">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Q{index + 1} · Essay</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm font-bold">Remove</button>
      </div>
      <input
        type="text"
        placeholder="Question text"
        value={q.question}
        onChange={(e) => onChange({ ...q, question: e.target.value })}
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:border-green-300 text-sm text-black"
      />
      <textarea
        placeholder="Grading rubric — what should a good answer include?"
        value={q.rubric}
        onChange={(e) => onChange({ ...q, rubric: e.target.value })}
        rows={3}
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:border-green-300 text-sm resize-none text-black"
      />
      <label className="text-xs text-gray-500 flex items-center gap-1 justify-end">
        Max points:
        <input
          type="number"
          min={1}
          value={q.maxPoints}
          onChange={(e) => onChange({ ...q, maxPoints: Number(e.target.value) })}
          className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-green-300 text-sm text-black"
        />
      </label>
    </div>
  );
}

// ─── Result Detail Modal ──────────────────────────────────────────────────────

function ResultDetailModal({
  result,
  quiz,
  onClose,
}: {
  result: QuizResult;
  quiz: Quiz | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{result.studentName}</h2>
            <p className="text-sm text-gray-400">{quiz?.title ?? "Unknown quiz"}</p>
            <p className="text-xs text-gray-300 mt-1">{new Date(result.submittedAt).toLocaleString()}</p>
          </div>
          <div className="text-right mr-4">
            <div className={`text-3xl font-bold ${result.percentage >= 70 ? "text-green-500" : result.percentage >= 50 ? "text-yellow-500" : "text-red-400"}`}>
              {result.percentage}%
            </div>
            <p className="text-sm text-gray-400">{result.totalScore} / {result.maxScore} pts</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-2xl leading-none ml-2">×</button>
        </div>

        {/* Answers */}
        <div className="p-6 flex flex-col gap-4">
          {!result.answers || result.answers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No answer details available.</p>
          ) : (
            result.answers.map((a, i) => {
              const q = quiz?.questions.find((q) => q.id === a.questionId);
              const isCorrect = (a.score ?? 0) > 0;
              const maxPts = q
                ? q.type === "multiple-choice"
                  ? (q as MultipleChoiceQuestion).points
                  : (q as EssayQuestion).maxPoints
                : "?";
              return (
                <div key={a.questionId} className={`rounded-xl p-4 ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                  <p className="font-semibold text-gray-700 text-sm mb-2">
                    Q{i + 1}: {q?.question ?? a.questionId}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Answer:{" "}
                    <span className="font-medium">
                      {a.answer
                        ? a.type === "multiple-choice" && q?.type === "multiple-choice"
                          ? `${a.answer.toUpperCase()}. ${(q as MultipleChoiceQuestion).options.find((o) => o.label === a.answer)?.text ?? ""}`
                          : a.answer
                        : "(no answer)"}
                    </span>
                  </p>
                  {a.feedback && (
                    <p className="text-sm mt-1 text-gray-500 italic">{a.feedback}</p>
                  )}
                  <p className="text-sm font-bold mt-1 text-right">
                    {a.score ?? 0} / {maxPts} pts
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({
  adminCode,
  currentModel,
  onModelChange,
}: {
  adminCode: string;
  currentModel: string;
  onModelChange: (model: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(model: string) {
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
      body: JSON.stringify({ defaultModel: model }),
    });
    if (res.ok) {
      onModelChange(model);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-700 mb-6">Settings</h2>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Default AI Model for Question Generation
        </label>
        <div className="flex gap-2">
          <select
            value={currentModel}
            onChange={(e) => handleSave(e.target.value)}
            disabled={saving}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-black bg-white h-14 appearance-none disabled:opacity-50"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        {saved && <p className="text-green-600 text-sm mt-2 font-medium">Saved!</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-2">
          This model will be pre-selected when you open the AI question generator.
          Super admins can change this for all users.
        </p>
      </div>
    </div>
  );
}
