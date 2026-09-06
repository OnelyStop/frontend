import type { Metadata } from "next";
import { getMyProfile } from "@/features/profile/queries.server";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function Page() {
  return <ProfileView profile={await getMyProfile()} />;
}
