import type { Metadata } from "next";
import { listMockPapers } from "@/features/question-bank/papers.server";
import { MocksView } from "./mocks-view";

export const metadata: Metadata = { title: "Mocks" };

// force-dynamic defers the query to request time so a build never depends on live schema/migration state.
export const dynamic = "force-dynamic";

export default async function Page() {
  const mocks = await listMockPapers();
  return <MocksView mocks={mocks} />;
}
