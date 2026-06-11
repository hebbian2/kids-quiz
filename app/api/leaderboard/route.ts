import { NextResponse } from "next/server";
import { getResults } from "@/lib/storage";

export async function GET() {
  const results = await getResults();

  // Keep only the best result per student name (highest percentage)
  const bestByName = new Map<string, { studentName: string; percentage: number; totalScore: number; maxScore: number }>();
  for (const r of results) {
    const name = r.studentName.trim();
    const existing = bestByName.get(name);
    if (!existing || r.percentage > existing.percentage) {
      bestByName.set(name, {
        studentName: name,
        percentage: r.percentage,
        totalScore: r.totalScore,
        maxScore: r.maxScore,
      });
    }
  }

  const top3 = Array.from(bestByName.values())
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  return NextResponse.json(top3);
}
