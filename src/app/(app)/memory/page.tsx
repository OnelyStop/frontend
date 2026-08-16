import type { Metadata } from "next";
import { MemoryView } from "./memory-view";

export const metadata: Metadata = { title: "A* Memory" };

export default function Page() {
  return <MemoryView />;
}
