# Data Interpretation — new chapter (Batch 4)

**Scope:** new `data-interpretation` chapter under Quantitative Aptitude,
6 topics in `content/quantitative-aptitude/data-interpretation/`.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Closes the corpus's single biggest gap by marks — DI carries ~35–60 marks
across SBI/IBPS and had zero coverage.

## Topics

| Topic                                 | Position | Difficulty   | Blocks | Cards | Words | Worked ex. | Practice    |
| ------------------------------------- | -------- | ------------ | ------ | ----- | ----- | ---------- | ----------- |
| `introduction-to-data-interpretation` | 10       | intermediate | 8      | 7     | 871   | 1          | ✓ (8 items) |
| `table-data-interpretation`           | 20       | intermediate | 8      | 7     | 727   | 1          | ✓ (8 items) |
| `bar-and-line-graph-interpretation`   | 30       | intermediate | 8      | 7     | 743   | 1          | ✓ (8 items) |
| `pie-chart-interpretation`            | 40       | intermediate | 8      | 7     | 774   | 1          | ✓ (8 items) |
| `caselet-data-interpretation`         | 50       | **advanced** | 8      | 8     | 924   | 2          | ✓ (8 items) |
| `data-sufficiency`                    | 60       | **advanced** | 8      | 7     | 1052  | 0¹         | ✓ (8 items) |

New chapter `data-interpretation`, chapterName "Data Interpretation",
chapterPosition 4 (after `work-and-motion` = 3). Prereqs draw on
`percentages`, `ratio-and-proportion`, `average`.

¹ `data-sufficiency` has no `worked_example` block on purpose: the validator
requires every QA `worked_example` to carry a recomputable numeric
`expectedAnswers`, and a data-sufficiency answer is an option letter, not a
number. Its three solved items live in a `method` block ("Three solved
items"); practice items are prose-reasoned with a single option letter +
one-line reason. **Reviewer decision needed:** accept this, or introduce a
non-numeric worked-example variant in the schema.

## Verification

- `study:validate` (full corpus, after import) → **63 topics, 0 errors**,
  1 warning (the pre-existing `para-jumbles` word-count soft warning; nothing
  in this batch).
- Imported idempotently (`study-import --dir .../data-interpretation`):
  6 versions created, 48 blocks, 43 flashcards.
- **Every numeric item's `expression` was recomputed against its `value`** by
  the validator, and the non-trivial ones re-checked by hand during review —
  all correct. Spot checks: pie `(0.40*800−0.20*800)/(0.20*800)*100` = 100;
  caselet funnel `0.60*0.75*800*(1−0.40)*0.25` = 54, `54/800*100` = 6.75;
  set overlap `220+160−340` = 40 both / 180 savings-only / 120 insurance-only;
  bar `((27+72)−(15+60))/(15+60)*100` = 32.
- Markdown renderer **does** support pipe tables (`parseMarkdown` in
  `src/features/study/markdown.tsx`) — all datasets are given as tables.
- Every dataset, caselet and question is original (invented numbers,
  office/banking register). No source dataset or explanation reproduced. No
  fabricated "asked in / previous year" provenance (one such phrase was
  caught by the validator mid-authoring and reworded).

## Provenance

Every factual block cites `WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA 4.0) as
the arithmetic / statistics / set-theory cross-check, plus `WIKIBOOKS_COPYRIGHT`
(`policy`) and `SATHEE_BANK` (`scope_only`, format confirmation only). All
already in `content/source-registry.json` — no new sources.

## Open items for the human reviewer

1. The `data-sufficiency` no-worked-example workaround (see ¹ above).
2. Re-verify the `data-sufficiency` practice key — items 6 (rhombus +
   rectangle ⇒ square) and 8 (two-equation system) carry the most reasoning.
3. Confirm `caselet-data-interpretation` and `data-sufficiency` at `advanced`.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
