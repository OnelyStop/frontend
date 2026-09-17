import "server-only";
import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { currentAffairsQuestions } from "@/db/schema";
import { dayBack, todayIst } from "@/features/current-affairs/day";
import type { CurrentAffairsQuestion, OptionKey } from "./types";

export const GAZETTE_TAG = "current-affairs";

const LIMIT = 50;

const RECENT_LIMIT = 60;

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

// Tagged because the pipeline runs on a CI runner now, outside this process: a backfill cannot revalidate in-process, and a day cached empty before it ran would stay empty for the whole revalidate window.
const cachedToday = unstable_cache(query, ["current-affairs", "today"], {
  revalidate: 300,
  tags: [GAZETTE_TAG],
});
const cachedPast = unstable_cache(query, ["current-affairs", "past"], {
  revalidate: 86_400,
  tags: [GAZETTE_TAG],
});

export function listQuestionsForDay(
  day: string,
): Promise<CurrentAffairsQuestion[]> {
  return day >= todayIst() ? cachedToday(day) : cachedPast(day);
}

// Sequential rather than parallel: a populated day carries LIMIT questions, so the cap lands within two.
export async function listRecentQuestions(
  days: number,
  delay = 0,
): Promise<CurrentAffairsQuestion[]> {
  const today = todayIst();
  const recent: CurrentAffairsQuestion[] = [];
  for (let n = 0; n < days && recent.length < RECENT_LIMIT; n++) {
    recent.push(...(await listQuestionsForDay(dayBack(today, n + delay))));
  }
  return recent.slice(0, RECENT_LIMIT);
}
