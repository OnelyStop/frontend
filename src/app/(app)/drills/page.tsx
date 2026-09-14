import type { Metadata } from "next";
import { listDrillPool } from "@/features/question-bank/questions.server";
import { DrillsView } from "./drills-view";

export const metadata: Metadata = { title: "Drills" };

export const dynamic = "force-dynamic";

export default async function Page() {
  const pool = await listDrillPool();
  return <DrillsView pool={pool} />;
}
