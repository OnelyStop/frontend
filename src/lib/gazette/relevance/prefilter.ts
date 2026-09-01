import { activeProfile } from "@/lib/gazette/config/profile";
import { normalizeText } from "@/lib/gazette/dedup/normalize";
import type { ArticleRow } from "@/lib/gazette/db/schema";

export type RelevanceVerdict = { drop: boolean; reason?: string };

function countHits(haystack: string, terms: string[]): number {
  let n = 0;
  for (const t of terms) if (haystack.includes(t)) n++;
  return n;
}

/**
 * Stage A of the banking-exam relevance filter — free, deterministic, runs
 * before any LLM call. Deliberately conservative: it only hard-drops a
 * NewsData article that hits a noise term and no signal term. Everything else
 * is left for the model gate in generation. RSS-sourced articles (RBI / PIB /
 * SEBI) are never dropped here — they're the regulators' own announcements.
 */
export function classifyRelevance(article: {
  source: ArticleRow["source"];
  title: string;
  summary: string;
}): RelevanceVerdict {
  if (article.source !== "newsdata_io") return { drop: false };

  const text = normalizeText(`${article.title} ${article.summary}`);
  const { positive, negative } = activeProfile.relevanceLexicon;
  const pos = countHits(text, positive);
  const neg = countHits(text, negative);

  if (neg > 0 && pos === 0) {
    return { drop: true, reason: `noise term, no signal (neg=${neg})` };
  }
  return { drop: false };
}
