import type { Metadata } from "next";
import { listMockPapers } from "@/features/question-bank/papers.server";
import { MocksView } from "./mocks-view";

export const metadata: Metadata = { title: "Mocks" };

// Question-bank content only changes when the import script reruns, not on
// every request — fetch on the server per docs/rendering.md, cache for an hour.
export const revalidate = 3600;

export default async function Page() {
  const mocks = await listMockPapers();
  return <MocksView mocks={mocks} />;
}
