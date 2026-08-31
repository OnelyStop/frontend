import type { Metadata } from "next";
import { listDrillPool } from "@/features/question-bank/questions.server";
import { DrillsView } from "./drills-view";

export const metadata: Metadata = { title: "Drills" };

// Same as mocks/page.tsx, same reason -- see the comment there.
export const dynamic = "force-dynamic";

export default async function Page() {
  const pool = await listDrillPool();
  return <DrillsView pool={pool} />;
}
