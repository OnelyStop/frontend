import type { Metadata } from "next";
import { listMockPapers } from "@/features/question-bank/papers.server";
import { MocksView } from "./mocks-view";

export const metadata: Metadata = { title: "Mocks" };

// ISR (revalidate) would be the ideal steady state per docs/rendering.md --
// this data only changes when the import script reruns -- but ISR pre-renders
// at build/deploy time too ("cooked at deploy"), which means every future
// build queries `papers`/`questions` whether or not the migration from #14
// has been applied to whatever database that build points at. force-dynamic
// defers the query to request time instead, so a build never depends on
// live schema state. Switch back to `export const revalidate = 3600` once
// the migration + import are confirmed applied wherever this deploys.
export const dynamic = "force-dynamic";

export default async function Page() {
  const mocks = await listMockPapers();
  return <MocksView mocks={mocks} />;
}
