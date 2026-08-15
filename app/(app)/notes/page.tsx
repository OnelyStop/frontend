import type { Metadata } from "next";
import { StickyNotesPage } from "@/views/StickyNotesPage";

export const metadata: Metadata = { title: "Sticky Notes" };

export default function Page() {
  return <StickyNotesPage />;
}
