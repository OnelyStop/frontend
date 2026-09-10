import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  getProgress,
  listRecentAttempts,
} from "@/features/attempts/progress.server";
import { currentUserId } from "@/lib/auth.server";
import { ProgressView } from "./progress-view";

export const metadata: Metadata = { title: "Progress" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/progress");

  const [progress, recent] = await Promise.all([
    getProgress(db, userId),
    listRecentAttempts(db, userId, 6),
  ]);

  return <ProgressView progress={progress} recent={recent} />;
}
