import type { Metadata } from "next";
import { MemoryPage } from "@/views/MemoryPage";

export const metadata: Metadata = { title: "A* Memory" };

export default function Page() {
  return <MemoryPage />;
}
