import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  getProfileStats,
  listRecentAttempts,
} from "@/features/attempts/progress.server";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { usageRows } from "@/features/billing/usage.server";
import { getMyProfile } from "@/features/profile/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/profile");

  const [profile, stats, recent, usage, { plan }] = await Promise.all([
    getMyProfile(),
    getProfileStats(db, userId),
    listRecentAttempts(db, userId, 8),
    usageRows(db, userId),
    getEntitlement(db, userId),
  ]);

  return (
    <ProfileView
      profile={profile}
      stats={stats}
      recent={recent}
      usage={usage}
      plan={plan}
    />
  );
}
