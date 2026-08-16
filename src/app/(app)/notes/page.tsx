import type { Metadata } from "next";
import { NotesView } from "./notes-view";

export const metadata: Metadata = { title: "Sticky Notes" };

export default function Page() {
  return <NotesView />;
}
