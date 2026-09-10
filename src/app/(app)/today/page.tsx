import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getProgress } from "@/features/attempts/progress.server";
import { currentUserId } from "@/lib/auth.server";
import { TodayView } from "./today-view";

export const metadata: Metadata = { title: "Today" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/today");

  return <TodayView progress={await getProgress(db, userId)} />;
}
