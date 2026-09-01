import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUserId } from "@/features/study/auth.server";
import {
  canPreview,
  getSubjectChapters,
  getTopicOutline,
  listNotes,
} from "@/features/study/queries.server";
import { Reader } from "@/features/study/components/Reader";

type Params = Promise<{
  subjectSlug: string;
  chapterSlug: string;
  topicSlug: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { topicSlug } = await params;
  const outline = await getTopicOutline(topicSlug, { preview: true });
  return { title: outline?.title ?? "Topic" };
}

export default async function Page({ params }: { params: Params }) {
  const { subjectSlug, chapterSlug, topicSlug } = await params;
  const preview = await canPreview();

  const [outline, subject] = await Promise.all([
    getTopicOutline(topicSlug, { preview }),
    getSubjectChapters(subjectSlug, { preview }),
  ]);
  if (!outline) notFound();

  const userId = await currentUserId();
  const notes = userId ? await listNotes(userId, outline.id) : [];

  return (
    <Reader
      subjectSlug={subjectSlug}
      chapterSlug={chapterSlug}
      outline={outline}
      chapters={subject?.chapters ?? []}
      initialNotes={notes}
      signedIn={Boolean(userId)}
    />
  );
}
