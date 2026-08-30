import type { Metadata } from "next";
import { FlashcardsView } from "./flashcards-view";

export const metadata: Metadata = { title: "Flashcards" };

export default function Page() {
  return <FlashcardsView />;
}
