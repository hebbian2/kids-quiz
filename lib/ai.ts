import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from "@/types/quiz";

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}

export async function generateQuestions(prompt: string): Promise<Question[]> {
  const result = await getModel().generateContent(
    `You are a teacher creating quiz questions for kids. Generate questions based on this request: "${prompt}"

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
  {
    "id": "unique-id-1",
    "type": "multiple-choice",
    "question": "Question text here?",
    "options": [
      { "label": "a", "text": "Option A text" },
      { "label": "b", "text": "Option B text" },
      { "label": "c", "text": "Option C text" },
      { "label": "d", "text": "Option D text" }
    ],
    "correctAnswer": "a",
    "points": 10
  },
  {
    "id": "unique-id-2",
    "type": "essay",
    "question": "Essay question text here?",
    "rubric": "What a good answer should include: ...",
    "maxPoints": 20
  }
]

Rules:
- Mix multiple-choice and essay questions as appropriate
- Multiple choice can have 2-5 options labeled a, b, c, d, e
- Make questions age-appropriate and engaging for kids
- Each id must be unique (use format: q-timestamp-index)
- Return only the JSON array, nothing else`
  );

  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const questions = JSON.parse(cleaned) as Question[];
  return questions.map((q, i) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
  }));
}

export async function gradeEssay(
  question: string,
  rubric: string,
  maxPoints: number,
  answer: string
): Promise<{ score: number; feedback: string }> {
  const result = await getModel().generateContent(
    `Grade this student essay answer for a kids quiz.

Question: ${question}
Grading rubric: ${rubric}
Maximum points: ${maxPoints}
Student's answer: ${answer}

Return ONLY valid JSON (no markdown):
{
  "score": <number between 0 and ${maxPoints}>,
  "feedback": "<encouraging, age-appropriate feedback in 1-2 sentences>"
}`
  );

  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as { score: number; feedback: string };
}
