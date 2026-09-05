import { env } from "@/lib/gazette/env";
import { activeProfile } from "@/lib/gazette/config/profile";
import { htmlToText } from "@/lib/gazette/sources/extract";
import type { RawArticle, ArticleScope } from "@/lib/gazette/types";

type NewsDataArticle = {
  title?: string | null;
  link?: string | null;
  description?: string | null;
  content?: string | null;
  pubDate?: string | null;
  duplicate?: boolean;
};

type NewsDataResponse = {
  status: string;
  results?: NewsDataArticle[];
  nextPage?: string | null;
  // Error shape
  message?: string;
};

async function fetchPage(
  params: Record<string, string>,
  page: string | null,
): Promise<NewsDataResponse> {
  const url = new URL(activeProfile.newsdata.endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", env.NEWSDATA_API_KEY);
  if (page) url.searchParams.set("page", page);

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (res.status === 429) {
      // One backoff, then give up — the next scheduled run will catch up.
      await new Promise((r) => setTimeout(r, 3_000));
      continue;
    }
    const body = (await res.json()) as NewsDataResponse;
    if (!res.ok || body.status !== "success") {
      throw new Error(
        `NewsData.io ${res.status}: ${body.message ?? "unknown error"}`,
      );
    }
    return body;
  }
  throw new Error("NewsData.io rate-limited after retry");
}

function toRawArticles(
  articles: NewsDataArticle[],
  scope: ArticleScope,
): RawArticle[] {
  const out: RawArticle[] = [];
  for (const a of articles) {
    if (!a.title || !a.link) continue;
    if (a.duplicate) continue; // NewsData's own near-duplicate flag
    const publishedAt = a.pubDate ? new Date(a.pubDate) : new Date();
    if (Number.isNaN(publishedAt.getTime())) continue;
    // `content` is "ONLY AVAILABLE IN PAID PLANS" on the free tier. `description`
    // is HTML and often smuggles the full body in a <content:encoded> CDATA
    // block — clean it the same way as a fetched page.
    out.push({
      source: "newsdata_io",
      title: a.title.trim(),
      summary: htmlToText(a.description ?? "").slice(0, 2_500),
      url: a.link,
      publishedAt,
      scope,
    });
  }
  return out;
}

async function fetchScope(
  params: Record<string, string>,
  scope: ArticleScope,
): Promise<RawArticle[]> {
  const collected: RawArticle[] = [];
  let page: string | null = null;
  for (let i = 0; i < activeProfile.newsdata.maxPages; i++) {
    const body: NewsDataResponse = await fetchPage(params, page);
    collected.push(...toRawArticles(body.results ?? [], scope));
    if (!body.nextPage) break;
    page = body.nextPage;
  }
  return collected;
}

/** India national + world headlines from NewsData.io. */
export async function fetchNewsData(): Promise<RawArticle[]> {
  const [national, international] = await Promise.all([
    fetchScope(activeProfile.newsdata.national, "national"),
    fetchScope(activeProfile.newsdata.international, "international"),
  ]);
  return [...national, ...international];
}
