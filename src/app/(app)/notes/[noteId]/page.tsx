import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNote } from "@/features/notes/notes.server";
import { NoteDetailView } from "./note-detail-view";

// Same reasoning as mocks/page.tsx — force-dynamic defers the query to
// request time so a build never depends on live schema/migration state.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ noteId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { noteId } = await params;
  const note = await getNote(decodeURIComponent(noteId));
  return { title: note ? note.title : "Note" };
}

export default async function Page({ params }: Params) {
  const { noteId } = await params;
  const note = await getNote(decodeURIComponent(noteId));
  if (!note) notFound();
  return <NoteDetailView note={note} />;
}
