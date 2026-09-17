import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  if (!userId) redirect("/login?from=/current-affairs");

  const today = todayIst();
  const { day: raw } = await searchParams;
  const inRange =
    raw && DAY_RE.test(raw) && raw <= today && raw >= EARLIEST_DAY;
  const asked = inRange ? raw : today;

  // The window is the plan's, not the URL's: a hand-typed day would bypass it.
  const { plan } = await getEntitlement(db, userId);
  const { currentAffairsDays: days, currentAffairsDelayDays: delay } =
    limitsFor(plan);

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
