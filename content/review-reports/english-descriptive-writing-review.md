# English — descriptive writing chapter (Batch 6)

**Scope:** new chapter `descriptive-writing` under English — 5 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Covers the SBI PO Mains descriptive paper (letter + essay, 50 marks / 30 min)
plus precis and email — none of which the corpus touched before.

## Topics

| Topic                        | Position | Difficulty   | Blocks | Cards | Words |
| ---------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `descriptive-paper-overview` | 10       | beginner     | 8      | 7     | ~986  |
| `formal-letter-writing`      | 20       | intermediate | 8      | 7     | ~1256 |
| `essay-writing`              | 30       | intermediate | 8      | 7     | ~1297 |
| `precis-writing`             | 40       | **advanced** | 8      | 7     | ~1283 |
| `email-writing`              | 50       | intermediate | 7      | 6     | ~1000 |

Chapter `descriptive-writing`, `chapterPosition` 3 (after grammar = 1,
exam-skills = 2). Subject-level fields copied from `error-detection.topic.json`.
English now has 23 topics across 3 chapters.

## Verification

- `study:validate` (full corpus, after import) → 0 errors for all 5 files
  (the single warning is the pre-existing `para-jumbles` word count).
- Imported idempotently (`study-import --dir content/english/descriptive-writing`):
  5 versions created, 39 blocks, 34 flashcards.
- **Precis worked example checked:** original passage 179 words → model precis
  62 words, ratio 0.35 (a touch over one-third; within the ~10% tolerance the
  topic itself states). Practice `expectedAnswers` recompute: `210/3` = 70,
  `330/3` = 110, `(144+51)/3` = 65.
- All letters, essays, the precis passage and emails are original, bank/office
  register. No published model answer or passage reproduced.
- Every practice item is a single-answer judgement task with a stated reason.

## Provenance

`WIKIBOOKS_ENGLISH_GRAMMAR` (`open_adaptable`, CC BY-SA) on every factual
block; `GUTENBERG_GRAMMAR` (`public_domain`) as a secondary cross-check on the
letter / essay / precis topics; `SATHEE_ENGLISH` (`scope_only`) for
paper-format confirmation only. All already in `content/source-registry.json`.

## Open items for the human reviewer

1. Confirm `precis-writing` at `advanced` and the other three at
   `intermediate`.
2. The descriptive paper's exact structure/marks vary by exam and year — the
   overview states them generically (typed, ~30 min, letter + essay) without
   pinning a cycle. Confirm that framing.
3. `descriptive-paper-overview` has no `worked_example` — it uses a
   `comparison` block (letter vs essay vs precis) plus a `practice` block.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
