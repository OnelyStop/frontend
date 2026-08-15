import type { Metadata } from "next";
import { TheoryPage } from "@/views/TheoryPage";

export const metadata: Metadata = { title: "Theory & Tricks" };

export default function Page() {
  return <TheoryPage />;
}
