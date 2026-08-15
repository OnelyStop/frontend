import type { Metadata } from "next";
import { InterviewPage } from "@/views/InterviewPage";

export const metadata: Metadata = { title: "AI Interview" };

export default function Page() {
  return <InterviewPage />;
}
