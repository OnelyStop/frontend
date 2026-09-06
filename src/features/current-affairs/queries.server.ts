import "server-only";
import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { currentAffairsQuestions } from "@/db/schema";
import { todayIst } from "@/lib/gazette/day";
import type { CurrentAffairsQuestion, OptionKey } from "./types";

const LIMIT = 50;

async function query(day: string): Promise<CurrentAffairsQuestion[]> {
  const rows = await db
    .select()
    .from(currentAffairsQuestions)
    .where(eq(currentAffairsQuestions.extractedDay, day))
    .orderBy(desc(currentAffairsQuestions.createdAt))
    .limit(LIMIT);

  return rows.map((q) => ({
    id: q.questionId,
    day: q.extractedDay,
    topic: q.topic,
    questionText: q.questionText,
    options: q.options,
    answer: q.answer as OptionKey,
    explanation: q.explanation,
  }));
}

// A day's set only changes while the evening run is writing it, so today is
// re-read every five minutes and any earlier day once a day.
const cachedToday = unstable_cache(query, ["current-affairs", "today"], {
  revalidate: 300,
});
const cachedPast = unstable_cache(query, ["current-affairs", "past"], {
  revalidate: 86_400,
});

export function listQuestionsForDay(
  day: string,
): Promise<CurrentAffairsQuestion[]> {
  return day >= todayIst() ? cachedToday(day) : cachedPast(day);
}
