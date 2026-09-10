import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getProgress } from "@/features/attempts/progress.server";
import {
  listQuestionsForDay,
  listRecentQuestions,
} from "@/features/current-affairs/queries.server";
import { todayIst } from "@/features/current-affairs/day";
import { unreadCount } from "@/features/notifications/queries.server";
import { listMockPapers } from "@/features/question-bank/papers.server";
import { currentUserId } from "@/lib/auth.server";
import { TodayView } from "./today-view";

export const metadata: Metadata = { title: "Today" };

// IST, not the server's clock: a Vercel function in Virginia says good morning at 9pm in Lucknow.
function greetingFor(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(now),
  );
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
}

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/today");

  const [progress, papers, todayQuestions, recentQuestions, unread] =
    await Promise.all([
      getProgress(db, userId),
      listMockPapers(),
      listQuestionsForDay(todayIst()),
      listRecentQuestions(7),
      unreadCount(userId),
    ]);

  // Formatted here, once: Node's ICU says "Sept" where Chrome says "Sep", and the mismatch fails hydration.
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <TodayView
      greeting={greetingFor(new Date())}
      today={today}
      progress={progress}
      papers={papers}
      rail={{
        currentAffairs: todayQuestions.length,
        flashcards: recentQuestions.length,
        unread,
      }}
    />
  );
}
