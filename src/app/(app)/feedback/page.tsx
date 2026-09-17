import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth.server";
import { FeedbackView } from "./feedback-view";

export const metadata: Metadata = { title: "Feedback" };

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login?from=/feedback");

  return <FeedbackView from={user.email} />;
}
