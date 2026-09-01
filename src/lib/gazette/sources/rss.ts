import Parser from "rss-parser";
import { activeProfile } from "@/lib/gazette/config/profile";
import type { RawArticle } from "@/lib/gazette/types";

// Several government sites (SEBI especially) drop requests without a
// browser-ish User-Agent, and SEBI in particular is slow — hence the longer
// timeout. A feed that still fails is handled below, not fatal.
const parser = new Parser({
  timeout: 30_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * RBI / PIB / SEBI press-release feeds — the official announcements banking
 * exams actually quiz on. A feed that fails to load is treated as empty so one
 * dead endpoint doesn't sink the whole ingest pass.
 */
export async function fetchRssFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    activeProfile.rssFeeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      const items: RawArticle[] = [];
      for (const item of parsed.items) {
        const title = (item.title ?? "").trim();
        const link = item.link ?? item.guid ?? "";
        if (!title || !link) continue;
        const publishedAt = item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date();
        if (Number.isNaN(publishedAt.getTime())) continue;
        items.push({
          source: feed.source,
          title,
          summary: stripHtml(item.contentSnippet ?? item.content ?? "").slice(0, 2_000),
          url: link,
          publishedAt,
          scope: feed.scope,
        });
      }
      return items;
    }),
  );

  const out: RawArticle[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") out.push(...r.value);
    else console.warn(`[rss] ${activeProfile.rssFeeds[i].source} failed: ${r.reason}`);
  });
  return out;
}
