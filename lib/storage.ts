import { Redis } from "@upstash/redis";
import { Quiz, QuizResult, Admin } from "@/types/quiz";

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

const KEYS = {
  quizzes: "quizzes",
  results: "results",
  admins: "admins",
  settings: "settings",
} as const;

export interface AppSettings {
  defaultModel: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: "gemini-flash-latest",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getList<T>(key: string): Promise<T[]> {
  const data = await getRedis().get<T[]>(key);
  return data ?? [];
}

async function setList<T>(key: string, data: T[]) {
  await getRedis().set(key, data);
}

// ─── Admins ───────────────────────────────────────────────────────────────────

async function seedSuperAdmin(admins: Admin[]): Promise<Admin[]> {
  const code = process.env.SUPER_ADMIN_CODE;
  if (!code) return admins;
  const idx = admins.findIndex((a) => a.id === "admin-super");
  if (idx === -1) {
    admins = [...admins, {
      id: "admin-super",
      name: "Super Admin",
      code,
      role: "super-admin",
      createdAt: new Date().toISOString(),
    }];
    await setList(KEYS.admins, admins);
  } else if (admins[idx].code !== code) {
    admins[idx] = { ...admins[idx], code };
    await setList(KEYS.admins, admins);
  }
  return admins;
}

export async function getAdmins(): Promise<Admin[]> {
  const admins = await getList<Admin>(KEYS.admins);
  return seedSuperAdmin(admins);
}

export async function getAdminByCode(code: string): Promise<Admin | undefined> {
  const admins = await getAdmins();
  return admins.find((a) => a.code === code);
}

export async function getAdminById(id: string): Promise<Admin | undefined> {
  const admins = await getAdmins();
  return admins.find((a) => a.id === id);
}

export async function saveAdmin(admin: Admin) {
  const admins = await getAdmins();
  const idx = admins.findIndex((a) => a.id === admin.id);
  if (idx >= 0) admins[idx] = admin;
  else admins.push(admin);
  await setList(KEYS.admins, admins);
}

export async function deleteAdmin(id: string) {
  const admins = await getAdmins();
  await setList(KEYS.admins, admins.filter((a) => a.id !== id));
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function getQuizzes(adminId?: string): Promise<Quiz[]> {
  const quizzes = await getList<Quiz>(KEYS.quizzes);
  if (!adminId) return quizzes;
  return quizzes.filter((q) => q.adminId === adminId);
}

export async function getQuizzesWithAdminName(adminId?: string): Promise<(Quiz & { adminName: string })[]> {
  const admins = await getAdmins();
  const quizzes = await getQuizzes(adminId);
  return quizzes.map((q) => ({
    ...q,
    adminName: admins.find((a) => a.id === q.adminId)?.name ?? "Unknown",
  }));
}

export async function getQuiz(id: string): Promise<Quiz | undefined> {
  const quizzes = await getList<Quiz>(KEYS.quizzes);
  return quizzes.find((q) => q.id === id);
}

export async function saveQuiz(quiz: Quiz) {
  const quizzes = await getList<Quiz>(KEYS.quizzes);
  const idx = quizzes.findIndex((q) => q.id === quiz.id);
  if (idx >= 0) quizzes[idx] = quiz;
  else quizzes.push(quiz);
  await setList(KEYS.quizzes, quizzes);
}

export async function deleteQuiz(id: string) {
  const quizzes = await getList<Quiz>(KEYS.quizzes);
  await setList(KEYS.quizzes, quizzes.filter((q) => q.id !== id));
}

// ─── Results ──────────────────────────────────────────────────────────────────

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const data = await getRedis().get<AppSettings>(KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...data };
}

export async function saveSettings(settings: AppSettings) {
  await getRedis().set(KEYS.settings, settings);
}

// ─── Results ──────────────────────────────────────────────────────────────────

export async function getResults(): Promise<QuizResult[]> {
  return getList<QuizResult>(KEYS.results);
}

export async function saveResult(result: QuizResult) {
  const results = await getList<QuizResult>(KEYS.results);
  results.push(result);
  await setList(KEYS.results, results);
}
