import { normalizeText } from "@/lib/gazette/dedup/normalize";
import { extractSalientTokens } from "@/lib/gazette/dedup/salientFacts";
import type { DraftQuestion } from "@/lib/gazette/types";

export type GroundingResult = { ok: boolean; reason: string };

type Source = { title: string; summary: string };

// Titles/honorifics that legitimately appear in a model's answer phrasing but
// not in a terse news snippet — don't count them against a name match.
const HONORIFICS = new Set([
  "shri",
  "smt",
  "dr",
  "mr",
  "mrs",
  "ms",
  "hon",
  "honble",
  "the",
  "a",
  "an",
  "union",
  "minister",
  "shrimati",
  "sushri",
]);

/**
 * The pipeline's only quality gate (spec §4): confirm the stated answer is
 * grounded in the source. Deterministic — no second model call.
 *
 * The "source" here is only the title + snippet we store (NewsData/RSS don't
 * give full body text on the free tier), so the check is lenient about
 * phrasing: an answer counts as grounded if it appears verbatim, shares a
 * distinguishing number, or has most of its content words present (tolerating
 * word-join/split and dropped honorifics). The firm guard that stays strict:
 * if the explanation cites a number, that number must appear in the source.
 */
export function isGrounded(q: DraftQuestion, source: Source): GroundingResult {
  const srcText = normalizeText(`${source.title} ${source.summary}`);
  if (!srcText) return { ok: false, reason: "empty source text" };
  const srcJoined = srcText.replace(/\s+/g, "");

  const answerRaw = q.options[q.answer];
  const answerNorm = normalizeText(answerRaw);
  const srcTokens = extractSalientTokens(source.title, source.summary);

  let grounded = answerNorm.length > 0 && srcText.includes(answerNorm);

  if (!grounded) {
    const answerNumbers = extractSalientTokens("", answerRaw).numbers;
    grounded = [...answerNumbers].some((n) => srcTokens.numbers.has(n));
  }

  if (!grounded) {
    const words = answerNorm
      .split(" ")
      .filter((w) => w.length >= 3 && !HONORIFICS.has(w));
    if (words.length > 0) {
      const hits = words.filter(
        (w) => srcText.includes(w) || srcJoined.includes(w),
      );
      const longHit = hits.some((w) => w.length >= 4);
      grounded = longHit && hits.length / words.length >= 0.5;
    }
  }

  if (!grounded) {
    return {
      ok: false,
      reason: `answer "${answerRaw}" not grounded in source`,
    };
  }

  const explNumbers = extractSalientTokens("", q.explanation).numbers;
  if (
    explNumbers.size > 0 &&
    ![...explNumbers].some((n) => srcTokens.numbers.has(n))
  ) {
    return {
      ok: false,
      reason: "explanation cites a number absent from source",
    };
  }

  return { ok: true, reason: "grounded" };
}
