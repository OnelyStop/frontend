import "server-only";

import { cache } from "react";
import { and, asc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { AUTH_DISABLED } from "@/config/auth";
import { getRole } from "@/features/auth/roles";
import type {
  ChapterOutline,
  SearchHit,
  TopicPath,
  TopicPreview,
  ContentBlock,
  Flashcard,
  StudyNote,
  SubjectSummary,
  TopicOutline,
} from "./types";

const {
  subjects,
  chapters,
  topics,
  contentVersions,
  contentBlocks,
  contentSources,
  contentBlockSources,
  flashcards,
  userNotes,
} = schema;

type Preview = { preview?: boolean };

// cache(): the page and its generateMetadata both ask — one round-trip, not two.
export const canPreview = cache(async (): Promise<boolean> => {
  if (AUTH_DISABLED) return true;
  return (await getRole()) !== null;
});

const publishedFilter = (opts?: Preview) =>
  opts?.preview ? undefined : eq(topics.status, "published");

export async function listSubjects(opts?: Preview): Promise<SubjectSummary[]> {
  const statusClause = opts?.preview
    ? sql``
    : sql`filter (where t.status = 'published')`;
  const rows = (await db.execute(sql`
    select s.slug, s.name, s.description,
      count(distinct c.id)::int as chapter_count,
      count(distinct t.id) ${statusClause}::int as topic_count
    from subjects s
    left join chapters c on c.subject_id = s.id
    left join topics t on t.chapter_id = c.id
    where s.is_active
    group by s.id
    order by s.position
  `)) as unknown as Array<{
    slug: string;
    name: string;
    description: string | null;
    chapter_count: number;
    topic_count: number;
  }>;
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    chapterCount: Number(r.chapter_count),
    topicCount: Number(r.topic_count),
  }));
}

export const getSubjectChapters = cache(async function getSubjectChapters(
  subjectSlug: string,
  opts?: Preview,
): Promise<{
  name: string;
  description: string | null;
  chapters: ChapterOutline[];
} | null> {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, subjectSlug),
  });
  if (!subject || !subject.isActive) return null;

  const chs = await db
    .select()
    .from(chapters)
    .where(eq(chapters.subjectId, subject.id))
    .orderBy(asc(chapters.position));
  if (chs.length === 0)
    return {
      name: subject.name,
      description: subject.description,
      chapters: [],
    };

  const tps = await db
    .select({
      chapterId: topics.chapterId,
      slug: topics.slug,
      title: topics.title,
      summary: topics.summary,
      difficulty: topics.difficulty,
      estimatedMinutes: topics.estimatedMinutes,
    })
    .from(topics)
    .where(
      and(
        inArray(
          topics.chapterId,
          chs.map((c) => c.id),
        ),
        publishedFilter(opts),
      ),
    )
    .orderBy(asc(topics.position), asc(topics.slug));

  return {
    name: subject.name,
    description: subject.description,
    chapters: chs.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      topics: tps
        .filter((t) => t.chapterId === c.id)
        .map((t) => ({
          slug: t.slug,
          title: t.title,
          summary: t.summary,
          difficulty:
            t.difficulty as ChapterOutline["topics"][number]["difficulty"],
          estimatedMinutes: t.estimatedMinutes,
        })),
    })),
  };
});

type TopicRow = typeof topics.$inferSelect;

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** generateMetadata only needs a title and a description, not the whole outline. */
export const getTopicMeta = cache(
  async (topicSlug: string): Promise<{ title: string; summary: string }> => {
    const fallback = { title: "Topic", summary: "" };
    const row = await db.query.topics.findFirst({
      where: isUuid(topicSlug)
        ? eq(topics.id, topicSlug)
        : eq(topics.slug, topicSlug),
      columns: { title: true, summary: true, status: true },
    });
    if (!row) return fallback;
    // Don't leak a draft topic's title into <title> for a non-staff visitor.
    if (row.status !== "published" && !(await canPreview())) return fallback;
    return { title: row.title, summary: row.summary };
  },
);

const resolveTopic = cache(async function resolveTopic(
  ref: string,
  opts?: Preview,
): Promise<TopicRow | null> {
  const row = await db.query.topics.findFirst({
    where: isUuid(ref) ? eq(topics.id, ref) : eq(topics.slug, ref),
  });
  if (!row) return null;
  if (!opts?.preview && row.status !== "published") return null;
  return row;
});

export const getTopicOutline = cache(async function getTopicOutline(
  topicSlug: string,
  opts?: Preview,
): Promise<TopicOutline | null> {
  const topic = await resolveTopic(topicSlug, opts);
  if (!topic) return null;

  // Each query is a remote round-trip; run the ones that only need `topic` at once.
  const [chapter, version, siblingRows] = await Promise.all([
    db.query.chapters.findFirst({ where: eq(chapters.id, topic.chapterId) }),
    db.query.contentVersions.findFirst({
      where: and(
        eq(contentVersions.topicId, topic.id),
        eq(contentVersions.version, topic.currentVersion),
      ),
    }),
    db
      .select({
        slug: topics.slug,
        title: topics.title,
        summary: topics.summary,
        difficulty: topics.difficulty,
        estimatedMinutes: topics.estimatedMinutes,
      })
      .from(topics)
      .where(and(eq(topics.chapterId, topic.chapterId), publishedFilter(opts)))
      .orderBy(asc(topics.position), asc(topics.slug)),
  ]);
  if (!chapter || !version) return null;

  const [subject, blockRows] = await Promise.all([
    db.query.subjects.findFirst({ where: eq(subjects.id, chapter.subjectId) }),
    db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.contentVersionId, version.id))
      .orderBy(asc(contentBlocks.position)),
  ]);
  if (!subject) return null;

  const linkRows = blockRows.length
    ? await db
        .select({
          blockId: contentBlockSources.blockId,
          registryKey: contentSources.registryKey,
          url: contentSources.url,
          title: contentSources.title,
          publisher: contentSources.publisher,
          usageMode: contentSources.usageMode,
          license: contentSources.license,
          retrievedAt: contentSources.retrievedAt,
        })
        .from(contentBlockSources)
        .innerJoin(
          contentSources,
          eq(contentSources.id, contentBlockSources.sourceId),
        )
        .where(
          inArray(
            contentBlockSources.blockId,
            blockRows.map((b) => b.id),
          ),
        )
    : [];

  const keysByBlock = new Map<string, string[]>();
  const sourceByUrl = new Map<string, TopicOutline["sources"][number]>();
  for (const l of linkRows) {
    const key = l.registryKey ?? l.url;
    keysByBlock.set(l.blockId, [...(keysByBlock.get(l.blockId) ?? []), key]);
    sourceByUrl.set(l.url, {
      registryKey: l.registryKey,
      url: l.url,
      title: l.title,
      publisher: l.publisher,
      usageMode: l.usageMode,
      license: l.license,
      retrievedAt: l.retrievedAt.toISOString(),
    });
  }

  const blocks: ContentBlock[] = blockRows.map((b) => ({
    stableKey: b.stableKey,
    type: b.type as ContentBlock["type"],
    title: b.title,
    bodyMarkdown: b.bodyMarkdown,
    position: b.position,
    sourceKeys: keysByBlock.get(b.id) ?? [],
  }));

  const idx = siblingRows.findIndex((s) => s.slug === topic.slug);
  const asRef = (s: (typeof siblingRows)[number] | undefined) =>
    s
      ? {
          slug: s.slug,
          title: s.title,
          summary: s.summary,
          difficulty: s.difficulty as TopicOutline["difficulty"],
          estimatedMinutes: s.estimatedMinutes,
        }
      : null;

  return {
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    difficulty: topic.difficulty as TopicOutline["difficulty"],
    estimatedMinutes: topic.estimatedMinutes,
    examTags: topic.examTags,
    learningObjectives: topic.learningObjectives,
    contentVersion: topic.currentVersion,
    lastReviewedAt: topic.lastReviewedAt?.toISOString() ?? null,
    subject: { slug: subject.slug, name: subject.name },
    chapter: { slug: chapter.slug, name: chapter.name },
    blocks,
    sources: [...sourceByUrl.values()],
    prev: asRef(idx > 0 ? siblingRows[idx - 1] : undefined),
    next: asRef(idx >= 0 ? siblingRows[idx + 1] : undefined),
  };
});

export async function listFlashcards(
  topicSlug: string,
  opts?: Preview,
): Promise<Flashcard[]> {
  const topic = await resolveTopic(topicSlug, opts);
  if (!topic) return [];
  const rows = await db
    .select()
    .from(flashcards)
    .where(
      and(
        eq(flashcards.topicId, topic.id),
        eq(flashcards.contentVersion, topic.currentVersion),
        opts?.preview ? undefined : eq(flashcards.status, "approved"),
      ),
    )
    .orderBy(asc(flashcards.position));
  return rows.map((r) => ({
    stableKey: r.stableKey,
    front: r.front,
    back: r.back,
    explanation: r.explanation,
    difficulty: r.difficulty as Flashcard["difficulty"],
    position: r.position,
  }));
}

const MAX_NOTE = 10_000;

function toNote(r: typeof userNotes.$inferSelect): StudyNote {
  return {
    id: r.id,
    topicId: r.topicId,
    blockStableKey: r.blockStableKey,
    bodyMarkdown: r.bodyMarkdown,
    color: r.color as StudyNote["color"],
    visibility: r.visibility,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listNotes(
  userId: string,
  topicId: string,
): Promise<StudyNote[]> {
  const rows = await db
    .select()
    .from(userNotes)
    .where(and(eq(userNotes.userId, userId), eq(userNotes.topicId, topicId)))
    .orderBy(asc(userNotes.createdAt));
  return rows.map(toNote);
}

export async function createNote(
  userId: string,
  topicId: string,
  input: {
    blockStableKey?: string | null;
    contentVersion?: number | null;
    bodyMarkdown: string;
    color?: string;
    selectedText?: string | null;
    textBefore?: string | null;
    textAfter?: string | null;
  },
): Promise<StudyNote | { error: "too_long" | "topic_not_found" }> {
  if (input.bodyMarkdown.length > MAX_NOTE) return { error: "too_long" };
  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
  });
  if (!topic) return { error: "topic_not_found" };

  const [row] = await db
    .insert(userNotes)
    .values({
      userId,
      topicId,
      blockStableKey: input.blockStableKey ?? null,
      contentVersion: input.contentVersion ?? topic.currentVersion,
      selectedText: input.selectedText ?? null,
      textBefore: input.textBefore ?? null,
      textAfter: input.textAfter ?? null,
      bodyMarkdown: input.bodyMarkdown,
      color: input.color ?? "yellow",
      // Private always: the client cannot opt a note into visibility (spec §8).
      visibility: "private",
      moderation: "not_required",
      // Millisecond precision, so the concurrency token round-trips on the first edit.
      updatedAt: new Date(),
    })
    .returning();
  return toNote(row);
}

export async function updateNote(
  userId: string,
  noteId: string,
  patch: { bodyMarkdown?: string; color?: string; expectedUpdatedAt?: string },
): Promise<StudyNote | { error: "not_found" | "too_long" | "conflict" }> {
  if (patch.bodyMarkdown !== undefined && patch.bodyMarkdown.length > MAX_NOTE)
    return { error: "too_long" };

  const set: Partial<typeof userNotes.$inferInsert> = { updatedAt: new Date() };
  if (patch.bodyMarkdown !== undefined) set.bodyMarkdown = patch.bodyMarkdown;
  if (patch.color !== undefined) set.color = patch.color;

  const where = [eq(userNotes.id, noteId), eq(userNotes.userId, userId)];
  if (patch.expectedUpdatedAt) {
    // Millisecond precision: an ISO round-trip loses the column's microseconds.
    const token = new Date(patch.expectedUpdatedAt);
    if (Number.isNaN(token.getTime())) return { error: "conflict" };
    where.push(
      sql`date_trunc('milliseconds', ${userNotes.updatedAt}) = ${token.toISOString()}::timestamptz`,
    );
  }

  const updated = await db
    .update(userNotes)
    .set(set)
    .where(and(...where))
    .returning();

  if (updated.length === 0) {
    // Distinguish "someone else's / gone" from "stale write".
    const exists = await db.query.userNotes.findFirst({
      where: and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)),
    });
    return { error: exists ? "conflict" : "not_found" };
  }
  return toNote(updated[0]);
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(userNotes)
    .where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)))
    .returning({ id: userNotes.id });
  return deleted.length > 0;
}

export async function topicIdFromSlug(
  topicSlug: string,
): Promise<string | null> {
  const row = await db.query.topics.findFirst({
    where: eq(topics.slug, topicSlug),
    columns: { id: true },
  });
  return row?.id ?? null;
}

/** Public-safe view of a topic: names and headings, never a block body. */
export const getTopicPreview = cache(async function getTopicPreview(
  topicSlug: string,
): Promise<TopicPreview | null> {
  const topic = await resolveTopic(topicSlug);
  if (!topic) return null;

  const [chapter, version, siblingRows] = await Promise.all([
    db.query.chapters.findFirst({ where: eq(chapters.id, topic.chapterId) }),
    db.query.contentVersions.findFirst({
      where: and(
        eq(contentVersions.topicId, topic.id),
        eq(contentVersions.version, topic.currentVersion),
      ),
    }),
    db
      .select({ slug: topics.slug, title: topics.title })
      .from(topics)
      .where(and(eq(topics.chapterId, topic.chapterId), publishedFilter()))
      .orderBy(asc(topics.position), asc(topics.slug)),
  ]);
  if (!chapter || !version) return null;

  const [subject, headings] = await Promise.all([
    db.query.subjects.findFirst({ where: eq(subjects.id, chapter.subjectId) }),
    db
      .select({ title: contentBlocks.title })
      .from(contentBlocks)
      .where(eq(contentBlocks.contentVersionId, version.id))
      .orderBy(asc(contentBlocks.position)),
  ]);
  // isActive too: deactivating a subject must take its topic pages down with it.
  if (!subject || !subject.isActive) return null;

  return {
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    difficulty: topic.difficulty as TopicPreview["difficulty"],
    estimatedMinutes: topic.estimatedMinutes,
    learningObjectives: topic.learningObjectives,
    subject: { slug: subject.slug, name: subject.name },
    chapter: { slug: chapter.slug, name: chapter.name },
    sectionTitles: headings.map((h) => h.title),
    siblings: siblingRows,
  };
});

/** Every published topic's URL, for the sitemap. */
export async function listTopicPaths(): Promise<TopicPath[]> {
  return db
    .select({
      topicSlug: topics.slug,
      chapterSlug: chapters.slug,
      subjectSlug: subjects.slug,
    })
    .from(topics)
    .innerJoin(chapters, eq(chapters.id, topics.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(and(publishedFilter(), eq(subjects.isActive, true)))
    .orderBy(asc(subjects.position), asc(chapters.position));
}

const SEARCH_LIMIT = 30;

/** Titles and summaries only — a public search must not reach lesson text. */
export async function searchPublic(query: string): Promise<SearchHit[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

  const [subjectRows, topicRows] = await Promise.all([
    db
      .select({
        slug: subjects.slug,
        name: subjects.name,
        description: subjects.description,
      })
      .from(subjects)
      .where(and(eq(subjects.isActive, true), ilike(subjects.name, like)))
      .limit(SEARCH_LIMIT),
    db
      .select({
        slug: topics.slug,
        title: topics.title,
        summary: topics.summary,
        chapterSlug: chapters.slug,
        chapterName: chapters.name,
        subjectSlug: subjects.slug,
        subjectName: subjects.name,
      })
      .from(topics)
      .innerJoin(chapters, eq(chapters.id, topics.chapterId))
      .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
      .where(
        and(
          publishedFilter(),
          eq(subjects.isActive, true),
          sql`(${topics.title} ilike ${like} or ${topics.summary} ilike ${like})`,
        ),
      )
      .orderBy(asc(topics.title))
      .limit(SEARCH_LIMIT),
  ]);

  return [
    ...subjectRows.map((s) => ({
      kind: "subject" as const,
      title: s.name,
      context: "Subject",
      summary: s.description,
      href: `/study/${s.slug}`,
    })),
    ...topicRows.map((t) => ({
      kind: "topic" as const,
      title: t.title,
      context: `${t.subjectName} · ${t.chapterName}`,
      summary: t.summary,
      href: `/study/${t.subjectSlug}/${t.chapterSlug}/${t.slug}`,
    })),
  ];
}
