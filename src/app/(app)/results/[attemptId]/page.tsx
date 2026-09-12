import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getScorecard } from "@/features/attempts/attempts.server";
import { ResultView } from "./result-view";

export const metadata: Metadata = { title: "Result" };

// Same reasoning as mocks/page.tsx — force-dynamic defers the query to request time.
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ ended?: string }>;
};

export default async function Page({ params, searchParams }: Params) {
  const { attemptId } = await params;
  const { ended } = await searchParams;
  const id = Number(attemptId);
  if (!Number.isInteger(id)) notFound();

  const scorecard = await getScorecard(id);
  if (!scorecard) notFound();

  return <ResultView scorecard={scorecard} flagged={ended === "flagged"} />;
}
