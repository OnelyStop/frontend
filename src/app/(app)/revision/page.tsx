import type { Metadata } from "next";
import { RevisionPage } from "@/views/RevisionPage";

export const metadata: Metadata = { title: "Revision Guide" };

export default function Page() {
  return <RevisionPage />;
}
