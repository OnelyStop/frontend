import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Reader } from "@/features/study/components/Reader";
import { TopicPreviewView } from "@/features/study/components/TopicPreviewView";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/config/site";
import {
  canPreview,
  getSubjectChapters,
  getTopicMeta,
  getTopicOutline,
  getTopicPreview,
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
  const { subjectSlug, chapterSlug, topicSlug } = await params;
  const { title, summary } = await getTopicMeta(topicSlug);
  const path = `/study/${subjectSlug}/${chapterSlug}/${topicSlug}`;
  return {
    title,
    description: summary || undefined,
    alternates: { canonical: path },
    openGraph: { url: `${SITE_URL}${path}`, title, description: summary },
  };
}

export default async function Page({ params }: { params: Params }) {
  const [userId, { subjectSlug, chapterSlug, topicSlug }, preview] =
    await Promise.all([currentUserId(), params, canPreview()]);

  // Signed out gets the syllabus only: this branch never loads a block body.
  if (!userId) {
    const topic = await getTopicPreview(topicSlug);
    if (!topic) notFound();
    if (
      topic.subject.slug !== subjectSlug ||
      topic.chapter.slug !== chapterSlug
    )
      redirect(
        `/study/${topic.subject.slug}/${topic.chapter.slug}/${topicSlug}`,
      );

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Knowledge base", item: `${SITE_URL}/study` },
        {
          name: topic.subject.name,
          item: `${SITE_URL}/study/${topic.subject.slug}`,
        },
        {
          name: topic.title,
          item: `${SITE_URL}/study/${subjectSlug}/${chapterSlug}/${topicSlug}`,
        },
      ].map((entry, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: entry.name,
        item: entry.item,
      })),
    };

    return (
      <>
        <JsonLd data={breadcrumb} />
        <TopicPreviewView topic={topic} />
      </>
    );
  }

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
