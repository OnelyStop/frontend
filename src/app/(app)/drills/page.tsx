import type { Metadata } from "next";
import { listDrillPool } from "@/features/question-bank/questions.server";
import { DrillsView } from "./drills-view";

export const metadata: Metadata = { title: "Drills" };

// Same as mocks/page.tsx: question-bank content only changes on a reimport.
export const revalidate = 3600;

export default async function Page() {
  const pool = await listDrillPool();
  return <DrillsView pool={pool} />;
}
