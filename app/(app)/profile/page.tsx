import type { Metadata } from "next";
import { ProfilePage } from "@/views/ProfilePage";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return <ProfilePage />;
}
