# Reasoning Ability — logical & analytical chapter (Batch 5b)

**Scope:** second chapter `logical-and-analytical-reasoning` under
`reasoning-ability` — 7 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + verification pass).
Human subject review still required.

## Topics

| Topic                                    | Position | Difficulty   | Blocks | Cards | Words |
| ---------------------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `number-and-alphabet-series`             | 10       | intermediate | 8      | 7     | ~840  |
| `analogy-and-classification`             | 20       | intermediate | 8      | 7     | ~739  |
| `logical-venn-diagrams`                  | 30       | intermediate | 8      | 7     | ~772  |
| `statement-and-assumption`               | 40       | intermediate | 8      | 7     | ~892  |
| `statement-and-conclusion-and-inference` | 50       | intermediate | 8      | 7     | ~817  |
| `cause-and-effect-and-course-of-action`  | 60       | intermediate | 8      | 7     | ~852  |
| `box-and-floor-puzzles`                  | 70       | **advanced** | 9      | 7     | ~1092 |

Chapter `chapterPosition` 2. Subject-level fields copied verbatim from
`arrangements-and-relations/coding-decoding.topic.json` (`subjectPosition` 6,
`contentVersion` 1). Reasoning Ability now has 14 topics across 2 chapters.

## Verification

- `study:validate` (full corpus, after import) → **0 errors, 0 warnings** for
  all 7 files.
- Imported idempotently (`study-import --dir content/reasoning-ability`):
  6 versions created (the 7th, `number-and-alphabet-series`, was already in
  the DB from an earlier partial run — unchanged).
- **`logical-venn-diagrams` region arithmetic recomputed:** worked example
  `30+20` = 50 / `30+25+20` = 75 / `25+20` = 45 (survey of 100 splits
  30/20/25/25 ✓). Practice: `22−8` = 14, `40−(22+18−8)` = 8,
  `(35−20)+(30−20)` = 25, `60−(35+30−20)` = 15.
- **`box-and-floor-puzzles` — all three puzzles independently re-derived**
  and each clue set forces exactly one arrangement:
  - WE1 (7 boxes): `S,P,R,U,T,Q,V` — the `P=3` branch dies on clue c2
    (R would land on U's slot).
  - WE2 (6 floors + colour): order `F,A,D,C,B,E`; B's colour is forced to
    yellow (adjacent to red and green, and clue d13 bars blue).
  - Practice (7 meetings Mon–Sun): `P,R,L,N,O,M,Q` — the L/M gap-of-3 has a
    single fit in the four free days. All 6 sub-answers match.
- The other five topics are prose-reasoned; every worked-example and practice
  item has one defensible answer with a stated one-line reason.
- All series, analogies, statements and puzzles are original.

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA — logic / series / Venn
cross-check) and `SATHEE_BANK` (`scope_only`, "standard question type" only).
Both already in `content/source-registry.json`. No new sources.

## Open items for the human reviewer

1. Confirm `box-and-floor-puzzles` at `advanced` and the other six at
   `intermediate` — several (statement-assumption, cause-effect) sit at the
   easier end of intermediate.
2. Re-verify the `statement-and-assumption` / `statement-and-conclusion`
   verdicts against your preferred convention — these question types have
   some genuine grey areas and the keys took the mainstream reading.
3. Batch 5c (input-output, coded inequalities, scheduling puzzles,
   data-sufficiency, logical connectives) is the planned third chapter.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
