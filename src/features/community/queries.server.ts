import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { doubtReplies, doubts, doubtStuck, profiles } from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import {
  PAGE_SIZE,
  type Doubt,
  type DoubtPage,
  type DoubtQuery,
  type DoubtThread,
} from "./types";
import { decodeCursor, encodeCursor } from "./cursor";

export async function listDoubts(query: DoubtQuery): Promise<DoubtPage> {
  const userId = await currentUserId();
  const cursor = query.cursor ? decodeCursor(query.cursor, query.sort) : null;
  const byStuck = query.sort === "stuck";

  // Keyset, not OFFSET: this feed reorders, and OFFSET would skip and repeat rows.
  const keyset = byStuck
    ? sql`(${doubts.stuckCount}, ${doubts.id}) < (${Number(cursor?.value)}, ${cursor?.id}::uuid)`
    : sql`(${doubts.createdAt}, ${doubts.id}) < (${cursor?.value}::timestamptz, ${cursor?.id}::uuid)`;

  const rows = await db
    .select({
      id: doubts.id,
      section: doubts.section,
      topic: doubts.topic,
      title: doubts.title,
      body: doubts.body,
      stuckCount: doubts.stuckCount,
      createdAt: doubts.createdAt,
      author: profiles.displayName,
      stuckByMe: sql<boolean>`${doubtStuck.userId} is not null`,
    })
    .from(doubts)
    .innerJoin(profiles, eq(profiles.id, doubts.authorId))
    .leftJoin(
      doubtStuck,
      userId
        ? and(eq(doubtStuck.doubtId, doubts.id), eq(doubtStuck.userId, userId))
        : sql`false`,
    )
    .where(
      and(
        query.section ? eq(doubts.section, query.section) : undefined,
        cursor ? keyset : undefined,
      ),
    )
    .orderBy(
      byStuck ? desc(doubts.stuckCount) : desc(doubts.createdAt),
      desc(doubts.id),
    )
    .limit(PAGE_SIZE + 1);

  const page = rows.slice(0, PAGE_SIZE);
  const last = page.at(-1);
  const hasMore = rows.length > PAGE_SIZE;

  return {
    doubts: page.map(toDoubt),
    nextCursor:
      hasMore && last
        ? encodeCursor({
            value: byStuck
              ? String(last.stuckCount)
              : last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

function toDoubt(r: {
  id: string;
  section: Doubt["section"];
  topic: string;
  title: string;
  body: string;
  stuckCount: number;
  createdAt: Date;
  author: string | null;
  stuckByMe: boolean;
}): Doubt {
  return {
    id: r.id,
    section: r.section,
    topic: r.topic,
    title: r.title,
    body: r.body,
    author: r.author ?? "Anonymous",
    createdAt: r.createdAt.toISOString(),
    stuckCount: r.stuckCount,
    stuckByMe: r.stuckByMe,
  };
}

/** Posts this calendar month, which is what the plan quota is measured in. */
export async function monthlyPostCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(doubts)
    .where(
      and(
        eq(doubts.authorId, userId),
        sql`${doubts.createdAt} >= date_trunc('month', now())`,
      ),
    );
  return row?.n ?? 0;
}

/** One doubt and every reply on it, oldest first — the reading order of a thread. */
export async function getThread(doubtId: string): Promise<DoubtThread | null> {
  const userId = await currentUserId();

  const [row] = await db
    .select({
      id: doubts.id,
      section: doubts.section,
      topic: doubts.topic,
      title: doubts.title,
      body: doubts.body,
      stuckCount: doubts.stuckCount,
      createdAt: doubts.createdAt,
      author: profiles.displayName,
      stuckByMe: sql<boolean>`${doubtStuck.userId} is not null`,
    })
    .from(doubts)
    .innerJoin(profiles, eq(profiles.id, doubts.authorId))
    .leftJoin(
      doubtStuck,
      userId
        ? and(eq(doubtStuck.doubtId, doubts.id), eq(doubtStuck.userId, userId))
        : sql`false`,
    )
    .where(eq(doubts.id, doubtId))
    .limit(1);

  if (!row) return null;

  const replies = await db
    .select({
      id: doubtReplies.id,
      body: doubtReplies.body,
      createdAt: doubtReplies.createdAt,
      author: profiles.displayName,
    })
    .from(doubtReplies)
    .innerJoin(profiles, eq(profiles.id, doubtReplies.authorId))
    .where(eq(doubtReplies.doubtId, doubtId))
    .orderBy(doubtReplies.createdAt, doubtReplies.id);

  return {
    doubt: {
      ...row,
      // displayName is nullable; the feed already falls back the same way.
      author: row.author ?? "Anonymous",
      createdAt: row.createdAt.toISOString(),
      stuckByMe: Boolean(row.stuckByMe),
    },
    replies: replies.map((r) => ({
      ...r,
      author: r.author ?? "Anonymous",
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
