// Wire-copy boilerplate, stripped before hashing so it cannot defeat the
// exact-duplicate gate.
const BOILERPLATE = [
  /also read:.*$/gim,
  /also watch:.*$/gim,
  /read more:.*$/gim,
  /click here.*$/gim,
  /follow us on.*$/gim,
  /\(with inputs from.*?\)/gi,
  /advertisement/gi,
];

// Shared by the content hash and salient-fact shingling so both stages see
// the same text.
export function normalizeText(input: string): string {
  let s = input.toLowerCase();
  for (const re of BOILERPLATE) s = s.replace(re, " ");
  s = s.replace(/https?:\/\/\S+/g, " ");
  s = s.replace(/[^\p{L}\p{N}\s%.-]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
