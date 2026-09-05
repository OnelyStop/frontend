# Reasoning Ability — new subject, arrangements chapter (Batch 5a)

**Scope:** new subject `reasoning-ability`, first chapter
`arrangements-and-relations` — 7 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author + a dedicated verification pass).
Human subject review still required.

Reasoning was deferred in the original spec; this batch starts it. It is the
largest remaining gap after Data Interpretation — Reasoning is a full section
in both prelims (35 marks) and mains (~60).

## Subject / chapter

- `subjectSlug` `reasoning-ability`, `subjectName` "Reasoning Ability",
  `subjectPosition` 6 (after `exam-guidance` = 5).
- Chapter `arrangements-and-relations` ("Arrangements and relations"),
  `chapterPosition` 1.
- A `reasoning-ability` blurb was added to the `/study` landing page
  (`src/app/(app)/study/study-view.tsx`) so the subject card is not blank.

## Topics

| Topic                         | Position | Difficulty   | Blocks | Cards | Words |
| ----------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `coding-decoding`             | 10       | intermediate | 8      | 7     | ~1000 |
| `blood-relations`             | 20       | intermediate | 8      | 7     | ~1000 |
| `direction-and-distance`      | 30       | intermediate | 8      | 7     | ~1000 |
| `order-and-ranking`           | 35       | intermediate | 9      | 7     | ~1144 |
| `linear-seating-arrangement`  | 40       | **advanced** | 9      | 8     | ~1300 |
| `circular-and-square-seating` | 60       | **advanced** | 9      | 8     | ~1300 |
| `syllogisms`                  | 70       | **advanced** | 9      | 8     | ~1300 |

(`order-and-ranking` sits at 35 — between `direction-and-distance` and the
advanced seating topics — because `linear-seating-arrangement` had already
taken 40.)

## Verification

- `study:validate` (full corpus, after import) → **0 errors, 0 warnings** for
  all 7 files.
- Imported idempotently (`study-import --dir content/reasoning-ability`).
- **Every puzzle was independently re-derived from its clue set** in a
  dedicated verification pass:
  - `linear-seating-arrangement` and `circular-and-square-seating` — both
    worked examples and both practice puzzles resolve to exactly **one**
    arrangement; the branch that doesn't (e.g. C at seat 6) is killed by a
    stated clue. Every sub-question answer matches the fixed arrangement.
  - `direction-and-distance` — every `expectedAnswers` expression recomputes
    (`((10+10)**2+10**2)**0.5` = 22.36, `(3**2+4**2)**0.5` = 5, …).
  - `order-and-ranking` — all 8 numeric items recompute (`7+11−1` = 17,
    `40−16+1` = 25, `(25−7+1)−9−1` = 9, …); the two prose chains force a
    unique order (S > R > P > Q > T).
  - `coding-decoding` — each derived rule is the only rule consistent with
    its example pairs.
  - `blood-relations` — each relation follows uniquely from the wording.
  - `syllogisms` — every follows / possibility / either-or verdict was
    Venn-checked against bank-exam convention.
- No edits were needed to the 6 topics written by the first (interrupted)
  authoring fork — all were already unique and correct.
- All names, codes, family trees and puzzles are original.

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA — logic / Venn / Pythagoras
cross-check) and `SATHEE_BANK` (`scope_only`, "standard question type" only).
Both already in `content/source-registry.json`. No new sources.

## Open items for the human reviewer

1. Confirm `subjectPosition` 6 for Reasoning (no existing subject renumbered).
2. Confirm the three `advanced` gradings (both seating topics, syllogisms).
3. Batch 5b (second chapter — series, analogy, Venn, statement-assumption /
   -conclusion, cause-effect, box-and-floor puzzles) is in progress
   separately; a `number-and-alphabet-series` row from it may already be in
   the DB when this batch is reviewed.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
