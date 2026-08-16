import type { Metadata } from "next";
import { RevisionView } from "./revision-view";

export const metadata: Metadata = { title: "Revision Guide" };

export default function Page() {
  return <RevisionView />;
}
