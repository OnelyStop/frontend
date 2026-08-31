/**
 * Pure rules shared by the import script and its test — no `server-only`,
 * since a vitest file imports this too and vitest doesn't run inside Next's
 * server boundary.
 *
 * `contentHash` and `isActive` are direct ports of
 * `pipeline/6-generate/generate.py`'s `content_key`/`_norm` and
 * `filter_pool` in OnelyStop/question-bank — reused, not reinvented, so a
 * question's identity and browsability agree with what the pipeline's own
 * mock generator already decides. See `import-rules.test.ts` for a golden
 * hash checked directly against the Python function.
 */

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
  source_pdf?: string | null;
  questions: RawQuestion[];
};

const MIN_OPTIONS = 4;

// NFKC settles composed/decomposed variants (the superscript "2" against a
// plain "2") before whitespace collapses and casing folds — same order as
// Python's `unicodedata.normalize("NFKC", s)` in `_norm`. Digits are never
// touched: 37% of near-duplicate pairs in this corpus differ only in their
// numbers, so anything fuzzier on digits merges two different questions.
function norm(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * The exact-hash key `pipeline/6-generate/generate.py::content_key` computes
 * until question-bank's own step 3 (dedupe) writes a real `content_hash`.
 * Falls through to `q.content_hash` unchanged if that ever appears.
 *
 * Verified against the real Python output for
 * `ibps_clerk_2020_prelims_f1a8daa3::q001` — see the golden-hash test.
 */
export function contentHash(q: RawQuestion): string {
  if (q.content_hash) return q.content_hash;

  const opts = Object.entries(q.options ?? {})
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${norm(v)}`)
    .join("\x00");
  const blob = `${norm(q.stem)}\x00${opts}`;

  return createHash("sha256").update(blob, "utf-8").digest("hex").slice(0, 16);
}

/**
 * The drop rules inside `filter_pool` (generate.py) that decide whether a
 * question is answerable at all, independent of any exam/blueprint filter.
 *
 * Deliberately NOT ported: `require_answer`, the bank/role/year blueprint
 * filters, the `seen`-dedup, and the "no section and no topic" drop. Those
 * are mock-generation policy — an unlabelled question is still browsable in
 * the question bank, so importing it as active is correct even though
 * `generate.py` itself would skip it when assembling a specific mock.
 */
export function isActive(q: RawQuestion): boolean {
  if (q.is_active === false) return false;
  if (!(q.stem ?? "").trim()) return false;
  if (Object.keys(q.options ?? {}).length < MIN_OPTIONS) return false;

  // A figure the extraction never produced makes the question unanswerable.
  const needsImage = q.has_image || q.direction_has_image;
  const hasImageRef =
    (q.image_refs && q.image_refs.length > 0) ||
    (q.direction_image_refs && q.direction_image_refs.length > 0);
  if (needsImage && !hasImageRef) return false;

  return true;
}

/** `[bank, role, examType, year, shift]` joined, per the spec doc's own definition. */
export function examKey(paper: RawPaper): string {
  return [paper.bank, paper.role, paper.exam_type, paper.year, paper.shift]
    .map((v) => (v === null || v === undefined || v === "" ? "unknown" : String(v)))
    .join("|")
    .toLowerCase();
}

export type DirectionRow = { paperId: string; directionId: string; body: string };

/**
 * One row per distinct (paper_id, direction_id) in this paper — the first
 * non-empty `direction_text` for an id wins. Warns rather than silently
 * picking a winner when two questions under the same pair disagree; that's a
 * real extractor-integrity signal, not something to paper over here.
 */
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
  return Array.from(byId, ([directionId, body]) => ({ paperId: paper.paper_id, directionId, body }));
}
