import type { Metadata } from "next";
import { QuestionBankView } from "./question-bank-view";

export const metadata: Metadata = { title: "Question Bank" };

export default function Page() {
  return <QuestionBankView />;
}
