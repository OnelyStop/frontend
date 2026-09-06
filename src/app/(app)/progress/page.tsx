import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getProgress } from "@/features/attempts/progress.server";
import { currentUserId } from "@/lib/auth.server";
import { ProgressView } from "./progress-view";

export const metadata: Metadata = { title: "Progress" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/progress");

  return <ProgressView progress={await getProgress(db, userId)} />;
}
