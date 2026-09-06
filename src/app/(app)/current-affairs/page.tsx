import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listQuestionsForDay } from "@/features/current-affairs/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor } from "@/features/billing/limits";
import {
  DAY_RE,
  oldestDayAllowed,
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
  const asked = raw && DAY_RE.test(raw) && raw <= today ? raw : today;

  // The window is the plan's, not the URL's: a hand-typed day would bypass it.
  const { plan } = await getEntitlement(db, userId);
  const days = limitsFor(plan).currentAffairsDays;
  const day =
    days !== null && asked < oldestDayAllowed(today, days) ? today : asked;

  return (
    <CurrentAffairsView
      key={day}
      day={day}
      today={today}
      questions={await listQuestionsForDay(day)}
    />
  );
}
