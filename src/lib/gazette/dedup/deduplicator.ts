import { contentHash } from "./contentHash";
import { extractSalientTokens, sameEvent, type SalientTokens } from "./salientFacts";
import type { RawArticle, ArticleScope } from "@/lib/gazette/types";

export type DedupVerdict = {
  verdict: "new" | "duplicate";
  stage?: 1 | 3;
};

export type RecentArticle = {
  contentHash: string;
  title: string;
  summary: string;
  scope: ArticleScope;
  publishedAt: Date;
};

/** IST calendar day (YYYY-MM-DD). Salient-facts matching is same-day only. */
export function istDayKey(d: Date): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

type Indexed = { day: string; scope: ArticleScope; tokens: SalientTokens };

/**
 * Dedup stages 1 (content hash) and 3 (salient facts). Stage 2 (MinHash/LSH)
 * is a deliberate gap — see the spec; add it here and in `articles.minhash_
 * signature` when near-verbatim reposts that share no salient numbers start
 * slipping through.
 *
 * Seed with the recent articles to compare against, then `check()` each
 * candidate. `register()` a candidate you accept so later ones in the same
 * batch dedupe against it too.
 */
export class Deduplicator {
  private hashes = new Set<string>();
  private indexed: Indexed[] = [];

  constructor(recent: RecentArticle[]) {
    for (const r of recent) {
      this.hashes.add(r.contentHash);
      this.indexed.push({
        day: istDayKey(r.publishedAt),
        scope: r.scope,
        tokens: extractSalientTokens(r.title, r.summary),
      });
    }
  }

  check(candidate: RawArticle): DedupVerdict {
    const hash = contentHash(candidate.title, candidate.summary);
    if (this.hashes.has(hash)) return { verdict: "duplicate", stage: 1 };

    const day = istDayKey(candidate.publishedAt);
    const tokens = extractSalientTokens(candidate.title, candidate.summary);
    for (const prior of this.indexed) {
      if (prior.scope !== candidate.scope || prior.day !== day) continue;
      if (sameEvent(tokens, prior.tokens)) return { verdict: "duplicate", stage: 3 };
    }
    return { verdict: "new" };
  }

  register(candidate: RawArticle): void {
    this.hashes.add(contentHash(candidate.title, candidate.summary));
    this.indexed.push({
      day: istDayKey(candidate.publishedAt),
      scope: candidate.scope,
      tokens: extractSalientTokens(candidate.title, candidate.summary),
    });
  }
}
