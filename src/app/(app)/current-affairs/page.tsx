import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listQuestionsForDay } from "@/features/current-affairs/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { DAY_RE, todayIst } from "@/lib/gazette/day";
import { CurrentAffairsView } from "./current-affairs-view";

export const metadata: Metadata = { title: "Current affairs" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  if (!(await currentUserId())) redirect("/login");

  const today = todayIst();
  const { day: raw } = await searchParams;
  const day = raw && DAY_RE.test(raw) && raw <= today ? raw : today;

  return (
    <CurrentAffairsView
      key={day}
      day={day}
      today={today}
      questions={await listQuestionsForDay(day)}
    />
  );
}
