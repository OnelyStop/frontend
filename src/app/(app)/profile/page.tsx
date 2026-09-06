import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileStats } from "@/features/attempts/progress.server";
import { getMyProfile } from "@/features/profile/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/profile");

  const [profile, stats] = await Promise.all([
    getMyProfile(),
    getProfileStats(userId),
  ]);

  return <ProfileView profile={profile} stats={stats} />;
}
