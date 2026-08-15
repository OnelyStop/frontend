import type { Metadata } from "next";
import { AIExamsPage } from "@/views/AIExamsPage";

export const metadata: Metadata = { title: "AI-Curated Exams" };

export default function Page() {
  return <AIExamsPage />;
}
