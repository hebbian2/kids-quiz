import { NextResponse } from "next/server";
import { getResults } from "@/lib/storage";

export async function GET() {
  const results = await getResults();

  // Aggregate per student: count unique quizzes attempted + accumulate total score
  const byName = new Map<string, { studentName: string; quizIds: Set<string>; totalScore: number; maxScore: number }>();
  for (const r of results) {
    const name = r.studentName.trim();
    const existing = byName.get(name);
    if (existing) {
      existing.quizIds.add(r.quizId);
      existing.totalScore += r.totalScore;
      existing.maxScore += r.maxScore;
    } else {
      byName.set(name, {
        studentName: name,
        quizIds: new Set([r.quizId]),
        totalScore: r.totalScore,
        maxScore: r.maxScore,
      });
    }
  }

  const top3 = Array.from(byName.values())
    .sort((a, b) => {
      // Primary: most quizzes attempted
      if (b.quizIds.size !== a.quizIds.size) return b.quizIds.size - a.quizIds.size;
      // Tiebreaker: highest total score
      return b.totalScore - a.totalScore;
    })
    .slice(0, 3)
    .map(({ studentName, quizIds, totalScore, maxScore }) => ({
      studentName,
      quizCount: quizIds.size,
      totalScore,
      maxScore,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    }));

  return NextResponse.json(top3);
}
