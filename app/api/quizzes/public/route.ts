import { NextResponse } from "next/server";
import { getQuizzesWithAdminName } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(await getQuizzesWithAdminName());
}
