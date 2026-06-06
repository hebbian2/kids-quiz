export type QuestionType = "multiple-choice" | "essay";

export interface MultipleChoiceQuestion {
  id: string;
  type: "multiple-choice";
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string; // label: "a" | "b" | "c" | "d" | "e"
  points: number;
}

export interface EssayQuestion {
  id: string;
  type: "essay";
  question: string;
  rubric: string;
  maxPoints: number;
}

export type Question = MultipleChoiceQuestion | EssayQuestion;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  createdAt: string;
  adminId: string;
}

export interface QuizAnswer {
  questionId: string;
  type: QuestionType;
  answer: string;
  score?: number;
  feedback?: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentName: string;
  answers: QuizAnswer[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
}

export type AdminRole = "admin" | "super-admin";

export interface Admin {
  id: string;
  name: string;
  code: string;
  role: AdminRole;
  createdAt: string;
}
