import type { Metadata } from "next";
import { TutorPage } from "@/views/TutorPage";

export const metadata: Metadata = { title: "AI Tutor" };

export default function Page() {
  return <TutorPage />;
}
