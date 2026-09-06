import type { Metadata } from "next";
import { listNotes } from "@/features/notes/notes.server";
import { NotesView } from "./notes-view";

export const metadata: Metadata = { title: "Notes" };

// Same reasoning as mocks/page.tsx — force-dynamic defers the query to request time.
export const dynamic = "force-dynamic";

export default async function Page() {
  const notes = await listNotes();
  return <NotesView notes={notes} />;
}
