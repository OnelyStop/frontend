// Boilerplate that wire copy and aggregators sprinkle through article text —
// stripped before hashing so it doesn't defeat the exact-duplicate gate.
const BOILERPLATE = [
  /also read:.*$/gim,
  /also watch:.*$/gim,
  /read more:.*$/gim,
  /click here.*$/gim,
  /follow us on.*$/gim,
  /\(with inputs from.*?\)/gi,
  /advertisement/gi,
];

/**
 * Lowercase, strip boilerplate + punctuation, collapse whitespace. Ported from
 * the Gazette Engine spec's `normalize_text`. Used for both the content hash
 * and salient-fact shingling so the two stages see the same text.
 */
export function normalizeText(input: string): string {
  let s = input.toLowerCase();
  for (const re of BOILERPLATE) s = s.replace(re, " ");
  s = s.replace(/https?:\/\/\S+/g, " ");
  s = s.replace(/[^\p{L}\p{N}\s%.-]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
