# Exam guidance — strategy pages (Batch 3e)

**Scope:** 4 new topics in `content/exam-guidance/strategy/`.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Evergreen preparation-strategy pages (no exam-cycle dates or vacancy figures —
those belong to a later cycle-specific batch that needs live notification
data).

## Scope change from the brief

3 of the 5 briefed topics overlapped existing files and were **not**
duplicated:

| Briefed                                 | Resolution                                                                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mock-tests-and-analysis`               | Dropped — `mock-test-analysis.topic.json` already covers it fully.                                                                                                                             |
| `exam-day-time-management`              | Reframed as `exam-day-execution` (CBT interface, three-pass method, question order, bad-start recovery); links existing `sectional-time-management` as a prerequisite.                         |
| `negative-marking-and-attempt-strategy` | Reframed as `attempt-strategy-and-cutoffs` (cutoff structure, net-score model, EV by elimination count, when to stop a section); links existing `negative-marking-strategy` as a prerequisite. |

## Topics

| Topic                          | Position | Difficulty       | Blocks | Cards | Words | Worked ex. / comparison | Practice        |
| ------------------------------ | -------- | ---------------- | ------ | ----- | ----- | ----------------------- | --------------- |
| `building-a-study-plan`        | 50       | beginner         | 9      | 7     | ~1031 | ✓ (12-week plan table)  | ✓ (6 scenarios) |
| `exam-day-execution`           | 60       | beginner         | 9      | 7     | ~1121 | ✓ (100Q/60min plan)     | ✓ (6 scenarios) |
| `attempt-strategy-and-cutoffs` | 70       | **intermediate** | 8      | 7     | ~1185 | ✓ (EV / net-score)      | ✓ (6 items)     |
| `revision-and-retention`       | 80       | beginner         | 9      | 7     | ~1041 | ✓ (comparison block)    | ✓ (6 items)     |

exam-guidance now has 8 topics; existing positions 10/20/30/40 untouched.

## Verification

- `study:validate` (full corpus, after import) → 0 errors for all 4 files.
- Imported idempotently (`study-import --dir content/exam-guidance`):
  4 versions created, 35 blocks, 28 flashcards.
- **`attempt-strategy-and-cutoffs` arithmetic re-checked by hand** — all
  correct: net `58 − 10·0.25` = 55.5, `45 − 5·0.25` = 43.75; EV of a guess
  = 0 (5 opts), 0.0625 (4), 0.1667 (3), 0.375 (2); net from 40 attempts
  `40·(0.85 − 0.25·0.15)` = 32.5 at 85% accuracy, 25 at 70%. Practice:
  `47 − 5·0.25` = 45.75; `0.90 − 0.25·0.10` = 0.875/attempt;
  `40·(0.80 − 0.25·0.20)` = 30 vs `40·(0.65 − 0.25·0.35)` = 22.5.
- All plans, tables and scenarios are original. Structure facts (prelims
  100Q/100, English 30 / QA 35 / Reasoning 35; 1/4 negative marking; mains
  sectional timing) stated plainly, cited to `scope_only` official sources,
  with **no year or vacancy figure attached**.

## Provenance

`SBI_PO_OVERVIEW`, `SBI_CAREERS`, `IBPS_HOME`, `SATHEE_BANK` (all `scope_only`,
permitted as factual in this subject), plus `WIKIBOOKS_MATH` for the EV
arithmetic. All already in `content/source-registry.json`.

## Open items for the human reviewer

1. **`attempt-strategy-and-cutoffs` at `intermediate`** — first non-beginner
   topic in this subject; confirm the grading.
2. **`revision-and-retention` provenance is thin** — the forgetting-curve /
   testing-effect / spacing material is cited only to `SATHEE_BANK`
   (scope_only); no invented figures, written as general principle. A
   public-domain study-skills / psychology source would strengthen it —
   candidate registry addition.
3. Source URLs use `sbi.co.in` to match the 4 existing exam-guidance files;
   the pending `sbi.co.in` → `sbi.bank.in` registry fix will touch these too.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
