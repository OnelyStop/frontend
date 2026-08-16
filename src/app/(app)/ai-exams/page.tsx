import type { Metadata } from "next";
import { AiExamsView } from "./ai-exams-view";

export const metadata: Metadata = { title: "AI-Curated Exams" };

export default function Page() {
  return <AiExamsView />;
}
