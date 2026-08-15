import type { Metadata } from "next";
import { DiagramPage } from "@/views/DiagramPage";

export const metadata: Metadata = { title: "Diagram Generator" };

export default function Page() {
  return <DiagramPage />;
}
