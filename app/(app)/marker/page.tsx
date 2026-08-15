import type { Metadata } from "next";
import { MarkerPage } from "@/views/MarkerPage";

export const metadata: Metadata = { title: "Answer Marker" };

export default function Page() {
  return <MarkerPage />;
}
