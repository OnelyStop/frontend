import { normalizeText } from "@/lib/gazette/dedup/normalize";
import { extractSalientTokens } from "@/lib/gazette/dedup/salientFacts";
import type { DraftQuestion } from "@/lib/gazette/types";

export type GroundingResult = { ok: boolean; reason: string };

type Source = { title: string; summary: string };

// Honorifics appear in a model's answer phrasing but not in a terse snippet.
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

// The only quality gate, deterministic. The source is just title + snippet
// (no full body on the free tier), so phrasing is matched leniently — but a
// number cited in the explanation must appear in the source.
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
