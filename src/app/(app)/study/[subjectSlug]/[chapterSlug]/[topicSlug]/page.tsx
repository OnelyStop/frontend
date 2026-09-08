import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Reader } from "@/features/study/components/Reader";
import {
  canPreview,
  getSubjectChapters,
  getTopicOutline,
  getTopicTitle,
  listFlashcards,
  listNotes,
} from "@/features/study/queries.server";
import { currentUserId } from "@/lib/auth.server";

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
  return { title: await getTopicTitle(topicSlug) };
}

export default async function Page({ params }: { params: Params }) {
  const [userId, { subjectSlug, chapterSlug, topicSlug }, preview] =
    await Promise.all([currentUserId(), params, canPreview()]);
  if (!userId) redirect("/login");

  const outline = await getTopicOutline(topicSlug, { preview });
  if (!outline) notFound();

  // The slug alone names the topic, so a stale path redirects to the canonical URL.
  if (
    outline.subject.slug !== subjectSlug ||
    outline.chapter.slug !== chapterSlug
  )
    redirect(
      `/study/${outline.subject.slug}/${outline.chapter.slug}/${topicSlug}`,
    );

  const [subject, notes, flashcards] = await Promise.all([
    getSubjectChapters(subjectSlug, { preview }),
    listNotes(userId, outline.id),
    listFlashcards(topicSlug, { preview }),
  ]);

  return (
    <Reader
      subjectSlug={subjectSlug}
      chapterSlug={chapterSlug}
      outline={outline}
      chapters={subject?.chapters ?? []}
      initialNotes={notes}
      flashcards={flashcards}
    />
  );
}
