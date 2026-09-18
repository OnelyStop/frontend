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
  topicRank,
} from "@/features/study/queries.server";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor, topicUnlocked } from "@/features/billing/limits";
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
    /* No openGraph block: it replaced the layout's, so every shared topic lost og:image. */
  };
}

export default async function Page({ params }: { params: Params }) {
  const [userId, { subjectSlug, chapterSlug, topicSlug }, preview] =
    await Promise.all([currentUserId(), params, canPreview()]);

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

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Knowledge base", item: `${SITE_URL}/study` },
      {
        name: outline.subject.name,
        item: `${SITE_URL}/study/${outline.subject.slug}`,
      },
      {
        name: outline.title,
        item: `${SITE_URL}/study/${subjectSlug}/${chapterSlug}/${topicSlug}`,
      },
    ].map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.item,
    })),
  };

  // Signed out reads on the free plan, never wider: these pages are indexed.
  const [plan, rank] = await Promise.all([
    userId
      ? getEntitlement(db, userId).then((e) => e.plan)
      : Promise.resolve("free" as const),
    topicRank(topicSlug),
  ]);

  // The syllabus view, not a redirect: a reader should see what is behind the wall.
  if (
    rank &&
    !topicUnlocked(limitsFor(plan), outline.subject.slug, rank.rank)
  ) {
    const topic = await getTopicPreview(topicSlug);
    if (!topic) notFound();
    return (
      <>
        <JsonLd data={breadcrumb} />
        <TopicPreviewView topic={topic} locked={Boolean(userId)} />
      </>
    );
  }

  const [subject, notes, flashcards] = await Promise.all([
    getSubjectChapters(subjectSlug, { preview }),
    userId ? listNotes(userId, outline.id) : Promise.resolve([]),
    listFlashcards(topicSlug, { preview }),
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <Reader
        subjectSlug={subjectSlug}
        chapterSlug={chapterSlug}
        outline={outline}
        chapters={subject?.chapters ?? []}
        initialNotes={notes}
        flashcards={flashcards}
        canAnnotate={Boolean(userId)}
      />
    </>
  );
}
