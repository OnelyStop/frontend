import type { Metadata } from "next";
import { QuestionBankPage } from "@/views/QuestionBankPage";

export const metadata: Metadata = { title: "Question Bank" };

export default function Page() {
  return <QuestionBankPage />;
}
