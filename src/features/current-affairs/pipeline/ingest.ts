import { and, gte, lt, ne } from "drizzle-orm";
import { db as defaultDb, type Db } from "@/db";
import { articles } from "@/db/schema";
import { activeProfile } from "@/features/current-affairs/config/profile";
import { contentHash } from "@/features/current-affairs/dedup/contentHash";
import {
  Deduplicator,
  type RecentArticle,
} from "@/features/current-affairs/dedup/deduplicator";
import { fetchNewsData } from "@/features/current-affairs/sources/newsdata";
import { fetchRssFeeds } from "@/features/current-affairs/sources/rss";
import type { RawArticle } from "@/features/current-affairs/types";
import { captureError } from "@/lib/observability.server";

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

// The content_hash index plus onConflictDoNothing survives a double-fired cron.
export async function runIngest(
  overrides: Partial<IngestDeps> = {},
  now = new Date(),
): Promise<IngestSummary> {
  const { db, fetchNews, fetchRss } = { ...defaultDeps, ...overrides };

  // allSettled, not all: a NewsData rate limit must not discard the RSS that worked.
  const [newsdata, rss] = await Promise.allSettled([fetchNews(), fetchRss()]);
  if (newsdata.status === "rejected")
    captureError(newsdata.reason, { at: "runIngest.newsdata" });
  if (rss.status === "rejected")
    captureError(rss.reason, { at: "runIngest.rss" });
  if (newsdata.status === "rejected" && rss.status === "rejected")
    throw new Error("every article source failed");

  const fetched = [
    ...(newsdata.status === "fulfilled" ? newsdata.value : []),
    ...(rss.status === "fulfilled" ? rss.value : []),
  ];
  const candidates: RawArticle[] = fetched
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
