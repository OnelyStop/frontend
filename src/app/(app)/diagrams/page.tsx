import type { Metadata } from "next";
import { DiagramsView } from "./diagrams-view";

export const metadata: Metadata = { title: "Diagram Generator" };

export default function Page() {
  return <DiagramsView />;
}
