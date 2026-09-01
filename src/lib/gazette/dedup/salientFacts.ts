// Stage 3 of dedup: genuine editorial paraphrase — two newsrooms describing the
// same fact in unrelated words — can score near-zero lexical overlap. Comparing
// the distinguishing *numbers and named entities* catches it. Rule (from the
// spec): two same-day articles are the same event when they share >=2 salient
// tokens with at least one of them a number. A shared entity alone is too weak
// ("RBI" appears in many unrelated stories); "RBI" + "6.5%" together is not.

export type SalientTokens = { numbers: Set<string>; entities: Set<string> };

// Multi-word names collapse to the same canonical token as their acronym.
const ALIASES: Record<string, string> = {
  "reserve bank of india": "rbi",
  "reserve bank": "rbi",
  "securities and exchange board of india": "sebi",
  "press information bureau": "pib",
  "monetary policy committee": "mpc",
  "goods and services tax": "gst",
  "national bank for agriculture and rural development": "nabard",
  "gross domestic product": "gdp",
  "consumer price index": "cpi",
  "wholesale price index": "wpi",
  "foreign portfolio investors": "fpi",
  "foreign portfolio investment": "fpi",
  "initial public offering": "ipo",
  "government of india": "goi",
  "reserve bank of india's": "rbi",
};

// Single Titlecase words this common are not distinguishing on their own.
const ENTITY_STOPWORDS = new Set([
  "the", "a", "an", "this", "that", "these", "those", "it", "he", "she", "they",
  "in", "on", "at", "after", "before", "during", "since", "when", "while",
  "and", "or", "but", "for", "to", "of", "with", "by", "from", "as", "new",
  "india", "indian", "government", "minister", "report", "monday", "tuesday",
  "wednesday", "thursday", "friday", "saturday", "sunday",
]);

const YEAR_RE = /^(?:19|20)\d{2}$/;

function normalizeNumberToken(raw: string): string | null {
  let t = raw.toLowerCase().trim();
  t = t.replace(/\s+per\s+cent\b/g, "%");
  t = t.replace(/\bpercent\b/g, "%");
  t = t.replace(/\bbasis points?\b/g, "bps");
  t = t.replace(/[₹$]|rs\.?|inr|usd/g, "");
  t = t.replace(/,/g, "");
  t = t.replace(/\s+/g, "");
  t = t.replace(/\.0+(\D|$)/g, "$1"); // 6.50% -> 6.5% ; 2000.00 -> 2000
  t = t.replace(/(\.\d*?)0+(\D|$)/g, "$1$2"); // 6.50% -> 6.5%
  t = t.replace(/\.$/, "");
  if (!t || t === "%" || t === "bps") return null;
  // Filter bare years only — "2000 crore" or "6.5%" carry a unit and are real.
  if (YEAR_RE.test(t)) return null;
  return t;
}

function extractNumbers(text: string): Set<string> {
  const out = new Set<string>();
  const patterns = [
    /\d+(?:\.\d+)?\s?(?:%|per\s?cent|percent)/gi,
    /(?:₹|rs\.?|inr|\$|usd)\s?\d[\d,]*(?:\.\d+)?\s?(?:crore|lakh|billion|million|trillion)?/gi,
    /\d[\d,]*(?:\.\d+)?\s?(?:crore|lakh|billion|million|trillion|bps|basis points?)/gi,
    /\d[\d,]{2,}(?:\.\d+)?/g, // 3+ digit bare numbers
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const tok = normalizeNumberToken(m[0]);
      if (tok) out.add(tok);
    }
  }
  return out;
}

function extractEntities(text: string): Set<string> {
  const out = new Set<string>();

  // ALLCAPS acronyms, 2-6 letters (RBI, SEBI, MPC, GDP, NABARD...).
  for (const m of text.matchAll(/\b[A-Z]{2,6}\b/g)) {
    out.add(m[0].toLowerCase());
  }

  // Titlecase runs, allowing lowercase connectors inside (Reserve Bank of India).
  for (const m of text.matchAll(
    /\b[A-Z][a-z]+(?:\s+(?:of|and|the|for|to)\s+|\s+)(?:[A-Z][a-z]+)(?:\s+(?:of|and|the|for|to)\s+[A-Z][a-z]+|\s+[A-Z][a-z]+)*/g,
  )) {
    out.add(m[0].toLowerCase().replace(/\s+/g, " ").trim());
  }
  // Standalone Titlecase words >=4 chars that aren't common.
  for (const m of text.matchAll(/\b[A-Z][a-z]{3,}\b/g)) {
    const w = m[0].toLowerCase();
    if (!ENTITY_STOPWORDS.has(w)) out.add(w);
  }

  // Canonicalize via the alias map.
  const canon = new Set<string>();
  for (const e of out) {
    canon.add(ALIASES[e] ?? e);
  }
  return canon;
}

export function extractSalientTokens(
  title: string,
  summary: string,
): SalientTokens {
  const text = `${title}. ${summary}`;
  return { numbers: extractNumbers(text), entities: extractEntities(text) };
}

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

export function sameEvent(a: SalientTokens, b: SalientTokens): boolean {
  const sharedNumbers = intersectionSize(a.numbers, b.numbers);
  const sharedEntities = intersectionSize(a.entities, b.entities);
  return sharedNumbers + sharedEntities >= 2 && sharedNumbers >= 1;
}
