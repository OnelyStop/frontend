/** Ports of `pipeline/6-generate/generate.py` in OnelyStop/question-bank, so a question's identity and browsability agree with the pipeline's. */

import { createHash } from "node:crypto";

export type RawQuestion = {
  q_id: string;
  paper_id: string;
  q_num: number;
  stem?: string | null;
  options?: Record<string, string> | null;
  answer?: string | null;
  explanation?: string | null;
  section?: string | null;
  topic?: string | null;
  difficulty?: number | null;
  direction_id?: string | null;
  direction_text?: string | null;
  has_image?: boolean | null;
  direction_has_image?: boolean | null;
  image_refs?: unknown[] | null;
  direction_image_refs?: unknown[] | null;
  is_active?: boolean | null;
  content_hash?: string | null;
};

export type RawPaper = {
  paper_id: string;
  bank?: string | null;
  role?: string | null;
  exam_type?: string | null;
  year?: number | null;
  shift?: string | null;
  memory_based?: boolean | null;
  source?: string | null;
  source_pdf?: string | null;
  questions: RawQuestion[];
};

const MIN_OPTIONS = 4;

// NFKC settles composed/decomposed variants before whitespace/casing fold; digits are never touched — 37% of near-duplicates differ only there.
function norm(s: string | null | undefined): string {
  return (s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Stands in for `content_key` until question-bank's dedupe step writes a real `content_hash`, which then wins unchanged. */
export function contentHash(q: RawQuestion): string {
  if (q.content_hash) return q.content_hash;

  const opts = Object.entries(q.options ?? {})
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${norm(v)}`)
    .join("\x00");
  const blob = `${norm(q.stem)}\x00${opts}`;

  return createHash("sha256").update(blob, "utf-8").digest("hex").slice(0, 16);
}

/** Answerability only: `filter_pool`'s blueprint, answer and dedupe drops are mock-generation policy, and an unlabelled question is still browsable here. */
export function isActive(q: RawQuestion): boolean {
  if (q.is_active === false) return false;
  if (!(q.stem ?? "").trim()) return false;
  if (Object.keys(q.options ?? {}).length < MIN_OPTIONS) return false;

  const needsImage = q.has_image || q.direction_has_image;
  const hasImageRef =
    (q.image_refs && q.image_refs.length > 0) ||
    (q.direction_image_refs && q.direction_image_refs.length > 0);
  if (needsImage && !hasImageRef) return false;

  return true;
}

/** Separate from `isActive`, which judges answerability: a question can be perfectly browsable and still have no key to grade against. */
export function hasAnswer(q: RawQuestion): boolean {
  return (q.answer ?? "").trim() !== "";
}

// Windows-generated rows store backslashes, and the filename carries detail the path does not — both are searched.
function sourceOf(paper: RawPaper): string {
  return `${paper.source_pdf ?? ""}/${paper.source ?? ""}`
    .replace(/\\/g, "/")
    .toLowerCase();
}

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

// Ordinals are matched first: "8-march-2025-4th-shift-1.pdf" ends in a copy counter that `shift[-_ ]?(\d)` would read as shift 1.
function shiftNo(src: string): string | null {
  const ordinal = src.match(/([1-4])(?:st|nd|rd|th)[-_ ]*shift/);
  if (ordinal) return ordinal[1]!;
  const labelled = src.match(/shift[-_ ]*([1-4])/);
  if (labelled) return labelled[1]!;
  const short = src.match(/[-_]s([1-4])(?=[-_.]|$)/);
  return short ? short[1]! : null;
}

function sittingDate(src: string): string | null {
  const named = src.match(new RegExp(`(\\d{1,2})[-_ ]*(${MONTHS})[a-z]*`));
  if (named)
    return `${Number(named[1])} ${named[2]![0]!.toUpperCase()}${named[2]!.slice(1)}`;
  const dotted = src.match(/(\d{1,2})\.(\d{1,2})\.\d{4}/);
  return dotted ? `${Number(dotted[1])}/${Number(dotted[2])}` : null;
}

/** Which sitting of an exam this is. The source JSON has no shift field, so the filename is the only record of it — null when even that never said. */
export function sittingOf(paper: RawPaper): string | null {
  if (paper.shift) return paper.shift;
  const src = sourceOf(paper);
  const date = sittingDate(src);
  const no = shiftNo(src);
  if (date && no) return `${date} · S${no}`;
  return date ?? (no ? `S${no}` : null);
}

/** IBPS files RRB Clerk and RRB PO under one "RRB" role, so two different exams share an identity; only the filename tells them apart. */
export function roleOf(paper: RawPaper): string | null {
  if (paper.role !== "RRB") return paper.role ?? null;
  const src = sourceOf(paper);
  if (/rrb[-_ ]*clerk/.test(src)) return "RRB-Clerk";
  if (/rrb[-_ ]*(po|officer)/.test(src)) return "RRB-PO";
  return "RRB";
}

/** `[bank, role, examType, year, shift]` joined, per the spec doc's own definition — role and shift resolved from the source, since the JSON records neither precisely. */
export function examKey(paper: RawPaper): string {
  return [
    paper.bank,
    roleOf(paper),
    paper.exam_type,
    paper.year,
    sittingOf(paper),
  ]
    .map((v) =>
      v === null || v === undefined || v === "" ? "unknown" : String(v),
    )
    .join("|")
    .toLowerCase();
}

export type DirectionRow = {
  paperId: string;
  directionId: string;
  body: string;
};

/** Two questions disagreeing on the same direction text is an extractor-integrity signal, so it warns rather than silently picking a winner. */
export function directionsOf(paper: RawPaper): DirectionRow[] {
  const byId = new Map<string, string>();
  for (const q of paper.questions) {
    const id = q.direction_id;
    const body = (q.direction_text ?? "").trim();
    if (!id || !body) continue;
    const existing = byId.get(id);
    if (existing === undefined) {
      byId.set(id, body);
    } else if (existing !== body) {
      console.warn(
        `[import-question-bank] ${paper.paper_id}/${id}: direction text disagrees ` +
          `across questions sharing this id — keeping the first seen.`,
      );
    }
  }
  return Array.from(byId, ([directionId, body]) => ({
    paperId: paper.paper_id,
    directionId,
    body,
  }));
}
