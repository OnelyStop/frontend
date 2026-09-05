import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getRole } from "@/features/auth/roles";
import type {
  ChapterOutline,
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
  studyProgress,
  chatConversations,
  chatMessages,
} = schema;

type Preview = { preview?: boolean };

/** Local dev, or a signed-in admin/editor, may see unpublished content. */
export async function canPreview(): Promise<boolean> {
  if (
    process.env.AUTH_DISABLED === "true" &&
    process.env.NODE_ENV !== "production"
  )
    return true;
  return (await getRole()) !== null;
}

const publishedFilter = (opts?: Preview) =>
  opts?.preview ? undefined : eq(topics.status, "published");

// --- catalogue ---------------------------------------------------------

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

export async function getSubjectChapters(
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
}

// --- one topic -------------------------------------------------------

type TopicRow = typeof topics.$inferSelect;

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Accepts a topic slug or a topic UUID. Enforces published unless previewing. */
async function resolveTopic(
  ref: string,
  opts?: Preview,
): Promise<TopicRow | null> {
  const row = await db.query.topics.findFirst({
    where: isUuid(ref) ? eq(topics.id, ref) : eq(topics.slug, ref),
  });
  if (!row) return null;
  if (!opts?.preview && row.status !== "published") return null;
  return row;
}

export async function getTopicOutline(
  topicSlug: string,
  opts?: Preview,
): Promise<TopicOutline | null> {
  const topic = await resolveTopic(topicSlug, opts);
  if (!topic) return null;

  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, topic.chapterId),
  });
  if (!chapter) return null;
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, chapter.subjectId),
  });
  if (!subject) return null;

  const version = await db.query.contentVersions.findFirst({
    where: and(
      eq(contentVersions.topicId, topic.id),
      eq(contentVersions.version, topic.currentVersion),
    ),
  });
  if (!version) return null;

  const blockRows = await db
    .select()
    .from(contentBlocks)
    .where(eq(contentBlocks.contentVersionId, version.id))
    .orderBy(asc(contentBlocks.position));

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

  // prev / next within the chapter, in stable order.
  const siblings = await db
    .select({
      slug: topics.slug,
      title: topics.title,
      summary: topics.summary,
      difficulty: topics.difficulty,
      estimatedMinutes: topics.estimatedMinutes,
    })
    .from(topics)
    .where(and(eq(topics.chapterId, topic.chapterId), publishedFilter(opts)))
    .orderBy(asc(topics.position), asc(topics.slug));
  const idx = siblings.findIndex((s) => s.slug === topic.slug);
  const asRef = (s: (typeof siblings)[number] | undefined) =>
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
    prev: asRef(idx > 0 ? siblings[idx - 1] : undefined),
    next: asRef(idx >= 0 ? siblings[idx + 1] : undefined),
  };
}

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

// --- notes (owner-scoped) -------------------------------------------

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
      // Private, always. Public sharing is a later phase (spec §8); the client
      // cannot opt a note into visibility here.
      visibility: "private",
      moderation: "not_required",
      // Set explicitly (JS millisecond precision) rather than leaving it to the
      // column default, so the value the client gets back round-trips exactly
      // as the optimistic-concurrency token on the first edit.
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
    // Compare at millisecond precision: the token round-trips through an ISO
    // string, so a raw equality against the column's microsecond timestamp
    // would reject every legitimate first edit.
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

// --- progress -------------------------------------------------------

export async function upsertProgress(
  userId: string,
  topicId: string,
  progressPercent: number,
): Promise<
  | { progressPercent: number; completedAt: string | null }
  | { error: "topic_not_found" }
> {
  // A UUID-shaped ref that names no topic would otherwise reach the
  // topic_id foreign key and surface as a 500; check first, like createNote.
  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    columns: { id: true },
  });
  if (!topic) return { error: "topic_not_found" };

  const pct = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const [row] = await db
    .insert(studyProgress)
    .values({
      userId,
      topicId,
      progressPercent: pct,
      completedAt: pct >= 100 ? new Date() : null,
      lastOpenedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [studyProgress.userId, studyProgress.topicId],
      set: {
        progressPercent: pct,
        lastOpenedAt: new Date(),
        completedAt: pct >= 100 ? new Date() : null,
      },
    })
    .returning();
  return {
    progressPercent: row.progressPercent,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

// --- tutor: retrieval + persistence -------------------------------

export type Conversation = {
  id: string;
  topicId: string;
  topicSlug: string;
  contentVersion: number;
};

export async function createConversation(
  userId: string,
  topicSlug: string,
  opts?: Preview,
): Promise<Conversation | null> {
  const topic = await resolveTopic(topicSlug, opts);
  if (!topic) return null;
  const [row] = await db
    .insert(chatConversations)
    .values({
      userId,
      topicId: topic.id,
      contentVersion: topic.currentVersion,
    })
    .returning();
  return {
    id: row.id,
    topicId: topic.id,
    topicSlug: topic.slug,
    contentVersion: row.contentVersion,
  };
}

export async function getOwnedConversation(
  userId: string,
  conversationId: string,
): Promise<typeof chatConversations.$inferSelect | null> {
  const row = await db.query.chatConversations.findFirst({
    where: and(
      eq(chatConversations.id, conversationId),
      eq(chatConversations.userId, userId),
    ),
  });
  return row ?? null;
}

export async function listMessages(userId: string, conversationId: string) {
  const conv = await getOwnedConversation(userId, conversationId);
  if (!conv) return null;
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt));
  return rows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    body: r.body,
    citedBlockKeys: r.citedBlockKeys,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Blocks of the conversation's pinned version, plus the top FTS hits. */
export async function loadTutorRetrieval(
  conv: typeof chatConversations.$inferSelect,
  question: string,
  userId: string,
  includeMyNotes: boolean,
) {
  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, conv.topicId),
  });
  if (!topic) return null;
  const version = await db.query.contentVersions.findFirst({
    where: and(
      eq(contentVersions.topicId, conv.topicId),
      eq(contentVersions.version, conv.contentVersion),
    ),
  });
  if (!version) return null;

  const allBlocks = await db
    .select({
      stableKey: contentBlocks.stableKey,
      type: contentBlocks.type,
      title: contentBlocks.title,
      bodyMarkdown: contentBlocks.bodyMarkdown,
      position: contentBlocks.position,
    })
    .from(contentBlocks)
    .where(eq(contentBlocks.contentVersionId, version.id))
    .orderBy(asc(contentBlocks.position));

  const ftsRows = question.trim()
    ? ((await db.execute(sql`
        select stable_key
        from content_blocks
        where content_version_id = ${version.id}
          and search_vector @@ plainto_tsquery('english', ${question})
        order by ts_rank(search_vector, plainto_tsquery('english', ${question})) desc
        limit 6
      `)) as unknown as Array<{ stable_key: string }>)
    : [];

  const history = (
    await db
      .select({ role: chatMessages.role, body: chatMessages.body })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conv.id))
      .orderBy(asc(chatMessages.createdAt))
  ).map((m) => ({ role: m.role as "user" | "assistant", content: m.body }));

  const notes = includeMyNotes
    ? (
        await db
          .select({ body: userNotes.bodyMarkdown })
          .from(userNotes)
          .where(
            and(
              eq(userNotes.userId, userId),
              eq(userNotes.topicId, conv.topicId),
            ),
          )
          .orderBy(asc(userNotes.createdAt))
      ).map((n) => n.body)
    : [];

  return {
    topic: {
      title: topic.title,
      summary: topic.summary,
      learningObjectives: topic.learningObjectives,
    },
    allBlocks,
    ftsBlockKeys: ftsRows.map((r) => r.stable_key),
    history,
    notes,
  };
}

export async function saveTutorTurn(
  conversationId: string,
  question: string,
  answer: string,
  citedBlockKeys: string[],
  tokenCount: number | null,
) {
  await db.transaction(async (tx) => {
    await tx.insert(chatMessages).values([
      { conversationId, role: "user", body: question, citedBlockKeys: [] },
      {
        conversationId,
        role: "assistant",
        body: answer,
        citedBlockKeys,
        tokenCount,
      },
    ]);
    await tx
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId));
  });
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
