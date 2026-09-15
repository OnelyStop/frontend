import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor } from "@/features/billing/limits";
import { listRecentQuestions } from "@/features/current-affairs/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { FlashcardsView } from "./flashcards-view";

export const metadata: Metadata = { title: "Flashcards" };

const UNCAPPED_DAYS = 60;

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/flashcards");

  const { plan } = await getEntitlement(db, userId);
  const limits = limitsFor(plan);
  const days = limits.currentAffairsDays ?? UNCAPPED_DAYS;
  const delay = limits.currentAffairsDelayDays ?? 0;

  return (
    <FlashcardsView
      currentAffairs={await listRecentQuestions(days, delay)}
      currentAffairsDays={days}
    />
  );
}
