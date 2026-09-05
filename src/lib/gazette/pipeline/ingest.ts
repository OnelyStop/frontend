import { and, gte, lt, ne } from "drizzle-orm";
import { db as defaultDb, type Db } from "@/db";
import { articles } from "@/db/schema";
import { activeProfile } from "@/lib/gazette/config/profile";
import { contentHash } from "@/lib/gazette/dedup/contentHash";
import {
  Deduplicator,
  type RecentArticle,
} from "@/lib/gazette/dedup/deduplicator";
import { fetchNewsData } from "@/lib/gazette/sources/newsdata";
import { fetchRssFeeds } from "@/lib/gazette/sources/rss";
import type { RawArticle } from "@/lib/gazette/types";

const RETENTION_DAYS = 90;

export type IngestSummary = {
  fetched: number;
  new: number;
  duplicate: number;
  conflict: number;
  pruned: number;
};

export type IngestDeps = {
  db: Db;
  fetchNews: typeof fetchNewsData;
  fetchRss: typeof fetchRssFeeds;
};

const defaultDeps: IngestDeps = {
  db: defaultDb,
  fetchNews: fetchNewsData,
  fetchRss: fetchRssFeeds,
};

// Everything but `used` rows, which a question still points back at.
async function pruneArticles(db: Db, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000);
  const rows = await db
    .delete(articles)
    .where(and(ne(articles.status, "used"), lt(articles.publishedAt, cutoff)))
    .returning({ id: articles.articleId });
  return rows.length;
}

// Idempotent: the content_hash unique index plus onConflictDoNothing means a
// double-fired cron cannot double-insert. `deps` keeps tests off the network.
export async function runIngest(
  overrides: Partial<IngestDeps> = {},
  now = new Date(),
): Promise<IngestSummary> {
  const { db, fetchNews, fetchRss } = { ...defaultDeps, ...overrides };

  const [newsdata, rss] = await Promise.all([fetchNews(), fetchRss()]);
  const candidates: RawArticle[] = [...newsdata, ...rss]
    .filter((a) => a.title && a.url)
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime())
    .slice(-activeProfile.maxArticlesPerIngest);

  const since = new Date(
    now.getTime() - (activeProfile.recentWindowDays + 1) * 86_400_000,
  );
  const recentRows = await db
    .select({
      contentHash: articles.contentHash,
      title: articles.title,
      summary: articles.summary,
      scope: articles.scope,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(gte(articles.publishedAt, since));

  const dedup = new Deduplicator(recentRows as RecentArticle[]);

  const summary: IngestSummary = {
    fetched: candidates.length,
    new: 0,
    duplicate: 0,
    conflict: 0,
    pruned: 0,
  };

  for (const c of candidates) {
    const verdict = dedup.check(c);
    const hash = contentHash(c.title, c.summary);

    const inserted = await db
      .insert(articles)
      .values({
        source: c.source,
        title: c.title,
        summary: c.summary,
        url: c.url,
        publishedAt: c.publishedAt,
        scope: c.scope,
        contentHash: hash,
        status: verdict.verdict === "new" ? "new" : "duplicate",
      })
      .onConflictDoNothing({ target: articles.contentHash })
      .returning({ id: articles.articleId });

    if (inserted.length === 0) {
      summary.conflict++;
      continue;
    }
    if (verdict.verdict === "new") {
      summary.new++;
      dedup.register(c); // later candidates in this batch dedupe against it too
    } else {
      summary.duplicate++;
    }
  }

  summary.pruned = await pruneArticles(db, now);
  return summary;
}
