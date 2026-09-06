import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getProgress } from "@/features/attempts/progress.server";
import { currentUserId } from "@/lib/auth.server";
import { HomeView } from "./home-view";

export const metadata: Metadata = { title: "Home" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/home");

  return <HomeView progress={await getProgress(db, userId)} />;
}
