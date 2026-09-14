import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  getProfileStats,
  listRecentAttempts,
} from "@/features/attempts/progress.server";
import { listMockPapers } from "@/features/question-bank/papers.server";
import { examSlug } from "@/features/question-bank/next-paper";
import { currentUserId } from "@/lib/auth.server";
import { MocksView } from "../mocks-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ exam: string }> };

async function examName(slug: string): Promise<string | null> {
  const mocks = await listMockPapers();
  return mocks.map((m) => m.name).find((n) => examSlug(n) === slug) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const name = await examName((await params).exam);
  return { title: name ? `${name} mocks` : "Mocks" };
}

export default async function Page({ params }: Params) {
  const slug = (await params).exam;
  const userId = await currentUserId();
  const [mocks, stats, recent] = await Promise.all([
    listMockPapers(),
    userId ? getProfileStats(db, userId) : null,
    userId ? listRecentAttempts(db, userId, 5) : [],
  ]);

  const name = mocks.map((m) => m.name).find((n) => examSlug(n) === slug);
  if (!name) notFound();

  return <MocksView mocks={mocks} stats={stats} recent={recent} exam={name} />;
}
