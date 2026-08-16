import type { Metadata } from "next";
import { TheoryView } from "./theory-view";

export const metadata: Metadata = { title: "Theory & Tricks" };

export default function Page() {
  return <TheoryView />;
}
