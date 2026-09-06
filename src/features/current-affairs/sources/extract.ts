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

// Not a DOM parser — good enough for news and the mostly-<p> PIB/RBI press
// releases. Capped so a huge page cannot blow up the prompt.
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

// Bot walls and challenge pages that some publishers serve with HTTP 200.
const BLOCK_PAGE =
  /(enable javascript and cookies|checking your browser|verify you are (a )?human|are you a robot|access denied|request unsuccessful|attention required|cloudflare|please try again in a few minutes|too many requests)/i;

function looksBlocked(text: string): boolean {
  return text.length < 600 && BLOCK_PAGE.test(text);
}

// Falls back to htmlToText when Readability decides the page is not
// article-shaped — short press releases and unusual govt templates.
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

// PIB frequently serves Hindi (Devanagari). We generate English MCQs, so that
// source text is skipped rather than fed to the model.
export function isMostlyEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 20) return true; // too short to judge — let the length gate decide
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return latin / letters >= 0.6;
}

// Feed items are third-party input, so a URL that resolves inside the network
// is never fetched from the server. DNS rebinding is out of scope for a daily
// cron; a private IP behind a public hostname would need a custom resolver.
export function isPublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.includes(":") // IPv6 literal
  )
    return false;
  const v4 = host.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!v4) return true;
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

const MAX_REDIRECTS = 3;

// Returns "" on any failure — paywall, bot block, timeout, non-HTML. Redirects
// are followed by hand so each hop gets the same origin check as the first URL.
export async function fetchArticleBody(url: string): Promise<string> {
  let target = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isPublicHttpUrl(target)) return "";
      const res = await fetch(target, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        target = new URL(location, target).toString();
        continue;
      }
      if (!res.ok) return "";
      if (!(res.headers.get("content-type") ?? "").includes("html")) return "";
      return extractMainText(await res.text());
    }
    return "";
  } catch {
    return "";
  }
}
