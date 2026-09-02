import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const MAX_BODY_CHARS = 6000;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  "#39": "'",
  "#x27": "'",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(
      /&([a-z0-9#]+);/gi,
      (m, name) => ENTITIES[name.toLowerCase()] ?? m,
    );
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crude readability: drop non-content regions, prefer an <article>/<main>
 * container, then collect block-level text. Good enough for news and
 * PIB/RBI press-release pages (which are mostly <p> tags); not a full DOM
 * parser. Capped so a huge page can't blow up the prompt.
 */
export function htmlToText(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<!\[CDATA\[/g, " ")
    .replace(/\]\]>/g, " ")
    // NB: not <form> — ASP.NET WebForms sites (PIB, RBI, many govt pages) wrap
    // the entire body in one <form>, so stripping it would delete everything.
    .replace(
      /<(script|style|noscript|svg|head|nav|header|footer|aside|figure|iframe)\b[\s\S]*?<\/\1>/gi,
      " ",
    );

  const container = s.match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i);
  if (container) s = container[2];

  const blocks: string[] = [];
  for (const m of s.matchAll(
    /<(p|li|h[1-4]|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi,
  )) {
    const t = stripTags(m[2]);
    if (t.length >= 40) blocks.push(t);
  }

  let text = blocks.join("\n");
  if (text.length < 200) text = stripTags(s); // fallback: whole container

  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);
}

function tidy(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Bot-wall / challenge / error interstitials some publishers serve with HTTP
// 200. Better to fall back to the RSS/NewsData snippet than feed this to the
// model.
const BLOCK_PAGE =
  /(enable javascript and cookies|checking your browser|verify you are (a )?human|are you a robot|access denied|request unsuccessful|attention required|cloudflare|please try again in a few minutes|too many requests)/i;

function looksBlocked(text: string): boolean {
  return text.length < 600 && BLOCK_PAGE.test(text);
}

/**
 * Main-content extraction: strip the nav bar, ad slots, byline furniture,
 * social-share buttons, "Also Read" boxes, related-article lists and footer,
 * and return just the article body. Uses Mozilla Readability (Firefox Reader
 * View's engine) over a linkedom DOM; falls back to the regex `htmlToText`
 * when Readability decides the page isn't article-shaped (short press
 * releases, unusual govt templates).
 */
export function extractMainText(html: string): string {
  try {
    const { document } = parseHTML(html);
    const article = new Readability(document as unknown as Document, {
      charThreshold: 200,
      keepClasses: false,
    }).parse();
    const text = tidy(article?.textContent ?? "");
    if (text.length >= 200 && !looksBlocked(text)) {
      return text.slice(0, MAX_BODY_CHARS);
    }
  } catch {
    // fall through to the regex extractor
  }
  const fallback = htmlToText(html);
  return looksBlocked(fallback) ? "" : fallback;
}

/**
 * Roughly: is this text mostly written in the Latin alphabet? PIB's feed and
 * pages frequently serve Hindi (Devanagari); we generate English MCQs, so
 * non-English source text is skipped rather than fed to the model.
 */
export function isMostlyEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 20) return true; // too short to judge — let the length gate decide
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return latin / letters >= 0.6;
}

/**
 * Fetch an article page and return its main text, or "" on any failure —
 * paywalls, bot blocks, timeouts, non-HTML. Called at generation time only
 * (once/day), so the extra GET per article is cheap.
 */
export async function fetchArticleBody(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return "";
    if (!(res.headers.get("content-type") ?? "").includes("html")) return "";
    return extractMainText(await res.text());
  } catch {
    return "";
  }
}
