import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  getProfileStats,
  getProgress,
  listRecentAttempts,
} from "@/features/attempts/progress.server";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { usageThisPeriod } from "@/features/billing/usage.server";
import { getMyProfile } from "@/features/profile/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/profile");

  const [profile, stats, progress, recent, entitlement, usage] =
    await Promise.all([
      getMyProfile(),
      getProfileStats(db, userId),
      getProgress(db, userId),
      listRecentAttempts(db, userId, 3),
      getEntitlement(db, userId),
      usageThisPeriod(db, userId),
    ]);

  return (
    <ProfileView
      profile={profile}
      stats={stats}
      progress={progress}
      recent={recent}
      entitlement={entitlement}
      usage={usage}
    />
  );
}
