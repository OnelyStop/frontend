import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor } from "@/features/billing/limits";
import { listRecentQuestions } from "@/features/current-affairs/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { FlashcardsView } from "./flashcards-view";

export const metadata: Metadata = { title: "Flashcards" };

// How far back an uncapped plan revises; the deck is trimmed to 60 cards regardless.
const UNCAPPED_DAYS = 60;

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/flashcards");

  const { plan } = await getEntitlement(db, userId);
  const days = limitsFor(plan).currentAffairsDays ?? UNCAPPED_DAYS;

  return (
    <FlashcardsView
      currentAffairs={await listRecentQuestions(days)}
      currentAffairsDays={days}
    />
  );
}
