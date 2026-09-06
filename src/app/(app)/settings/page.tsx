import type { Metadata } from "next";
import { getMyProfile } from "@/features/profile/queries.server";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  return <SettingsView profile={await getMyProfile()} />;
}
