import { contentHash } from "./contentHash";
import {
  extractSalientTokens,
  sameEvent,
  type SalientTokens,
} from "./salientFacts";
import { istDayKey } from "@/lib/gazette/day";
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

type Indexed = { day: string; scope: ArticleScope; tokens: SalientTokens };

// Stages 1 (content hash) and 3 (salient facts). Stage 2 (MinHash/LSH) is a
// deliberate gap — add it when near-verbatim reposts sharing no salient
// numbers start slipping through.
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
      if (sameEvent(tokens, prior.tokens))
        return { verdict: "duplicate", stage: 3 };
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
