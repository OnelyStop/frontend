import type { Metadata } from "next";
import { db } from "@/db";
import {
  getProfileStats,
  listRecentAttempts,
} from "@/features/attempts/progress.server";
import { listMockPapers } from "@/features/question-bank/papers.server";
import { currentUserId } from "@/lib/auth.server";
import { MocksView } from "./mocks-view";

export const metadata: Metadata = { title: "Mocks" };

// force-dynamic defers the query to request time so a build never depends on live schema/migration state.
export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await currentUserId();
  const [mocks, stats, recent] = await Promise.all([
    listMockPapers(),
    userId ? getProfileStats(db, userId) : null,
    userId ? listRecentAttempts(db, userId, 5) : [],
  ]);
  return <MocksView mocks={mocks} stats={stats} recent={recent} />;
}
