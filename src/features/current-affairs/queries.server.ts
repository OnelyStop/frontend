import "server-only";
import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { currentAffairsQuestions } from "@/db/schema";
import { dayBack, todayIst } from "@/features/current-affairs/day";
import type { CurrentAffairsQuestion, OptionKey } from "./types";

const LIMIT = 50;

// A revision deck, not the archive: enough to fill a session, not a whole quarter.
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

// A day's set only changes during the evening run, hence the two cache lives.
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

// Sequential rather than parallel: a populated day carries LIMIT questions, so the cap lands within two.
export async function listRecentQuestions(
  days: number,
): Promise<CurrentAffairsQuestion[]> {
  const today = todayIst();
  const recent: CurrentAffairsQuestion[] = [];
  for (let n = 0; n < days && recent.length < RECENT_LIMIT; n++) {
    recent.push(...(await listQuestionsForDay(dayBack(today, n))));
  }
  return recent.slice(0, RECENT_LIMIT);
}
