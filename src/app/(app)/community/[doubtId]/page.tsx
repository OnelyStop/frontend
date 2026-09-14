import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getThread } from "@/features/community/queries.server";
import { ThreadView } from "./thread-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ doubtId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const thread = await getThread((await params).doubtId);
  return { title: thread ? thread.doubt.title : "Doubt" };
}

export default async function Page({ params }: Params) {
  const thread = await getThread((await params).doubtId);
  if (!thread) notFound();
  return <ThreadView thread={thread} />;
}
