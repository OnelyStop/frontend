import type { Metadata } from "next";
import { listAllNotes } from "@/features/study/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { NotesView } from "./notes-view";

export const metadata: Metadata = { title: "Notes" };

// Same reasoning as mocks/page.tsx — force-dynamic defers the query to request time.
export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await currentUserId();
  const notes = userId ? await listAllNotes(userId) : [];
  return <NotesView notes={notes} />;
}
