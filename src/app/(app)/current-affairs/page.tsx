import type { Metadata } from "next";
import { listQuestionsForDay } from "@/features/current-affairs/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor } from "@/features/billing/limits";
import {
  DAY_RE,
  EARLIEST_DAY,
  allowedDays,
  todayIst,
} from "@/features/current-affairs/day";
import { CurrentAffairsView } from "./current-affairs-view";

export const metadata: Metadata = { title: "Current affairs" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const userId = await currentUserId();

  const today = todayIst();
  const { day: raw } = await searchParams;
  const inRange =
    raw && DAY_RE.test(raw) && raw <= today && raw >= EARLIEST_DAY;
  const asked = inRange ? raw : today;

  // The plan's window, not the URL's, and signed out reads the free one: this page is indexed.
  const { currentAffairsDays: days, currentAffairsDelayDays: delay } =
    limitsFor(userId ? (await getEntitlement(db, userId)).plan : "free");

  let day = asked;
  let newest = today;
  if (days !== null) {
    const window = allowedDays(today, days, delay ?? 0);
    newest = window.newest;
    // Clamped to the newest day they may read, never to today: today is behind the delay.
    if (asked > newest || asked < window.oldest) day = newest;
  }

  return (
    <CurrentAffairsView
      key={day}
      day={day}
      newest={newest}
      delayDays={delay}
      questions={await listQuestionsForDay(day)}
    />
  );
}
