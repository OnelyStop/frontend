import type { Metadata } from "next";
import { DrillsView } from "./drills-view";

export const metadata: Metadata = { title: "Drills" };

export default function Page() {
  return <DrillsView />;
}
