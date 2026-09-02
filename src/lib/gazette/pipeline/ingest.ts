import { gte } from "drizzle-orm";
import { getDb } from "@/lib/gazette/db";
import { articles } from "@/lib/gazette/db/schema";
import { activeProfile } from "@/lib/gazette/config/profile";
import { contentHash } from "@/lib/gazette/dedup/contentHash";
import {
  Deduplicator,
  type RecentArticle,
} from "@/lib/gazette/dedup/deduplicator";
import { fetchNewsData } from "@/lib/gazette/sources/newsdata";
import { fetchRssFeeds } from "@/lib/gazette/sources/rss";
import type { RawArticle } from "@/lib/gazette/types";

export type IngestSummary = {
  fetched: number;
  new: number;
  duplicate: number;
  conflict: number;
};

export type IngestDeps = {
  fetchNews: typeof fetchNewsData;
  fetchRss: typeof fetchRssFeeds;
};

const defaultDeps: IngestDeps = {
  fetchNews: fetchNewsData,
  fetchRss: fetchRssFeeds,
};

/**
 * One ingest pass: pull every source, dedupe (stages 1 + 3), and store each
 * article as `new` or `duplicate`. Idempotent — the `content_hash` unique index
 * plus `onConflictDoNothing` means a double-fired cron can't double-insert.
 * `deps` is injectable so tests never hit the network.
 */
export async function runIngest(
  deps: IngestDeps = defaultDeps,
): Promise<IngestSummary> {
  const db = await getDb();
  const [newsdata, rss] = await Promise.all([
    deps.fetchNews(),
    deps.fetchRss(),
  ]);
  const candidates: RawArticle[] = [...newsdata, ...rss]
    .filter((a) => a.title && a.url)
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime())
    .slice(-activeProfile.maxArticlesPerIngest);

  const since = new Date(
    Date.now() - (activeProfile.recentWindowDays + 1) * 86_400_000,
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

  return summary;
}
