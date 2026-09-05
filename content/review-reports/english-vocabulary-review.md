# English — vocabulary chapter (Batch 8e)

**Scope:** new chapter `vocabulary` under English — 5 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Covers the vocabulary-in-context question cluster (idioms, one-word
substitution, synonyms/antonyms, confusables, phrasal verbs) — a standing part
of every SBI/IBPS English section that the corpus did not touch.

## Topics

| Topic                              | Position | Difficulty   | Blocks | Cards | Words |
| ---------------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `idioms-and-phrases`               | 10       | intermediate | 9      | 7     | ~1150 |
| `one-word-substitution`            | 20       | intermediate | 9      | 7     | ~950  |
| `synonyms-and-antonyms-in-context` | 30       | intermediate | 9      | 7     | ~1050 |
| `commonly-confused-words`          | 40       | intermediate | 8      | 7     | ~900  |
| `phrasal-verbs`                    | 50       | intermediate | 9      | 7     | ~1080 |

Chapter `vocabulary`, `chapterPosition` 4 (after grammar 1, exam-skills 2,
descriptive-writing 3). Subject fields copied from `error-detection.topic.json`.
English now has 28 topics across 4 chapters.

## Verification

- `study:validate` (full corpus, after import) → 0 errors for all 5 files.
- Imported idempotently (`study-import --dir content/english/vocabulary`):
  5 versions created, 44 blocks, 35 flashcards.
- No `expectedAnswers` in this batch — every worked-example and practice item
  is prose-reasoned with one defensible answer and a one-line reason.
- All example sentences, the idiom/word groupings, and the confusable
  distinctions are original, banking/office register. The words themselves are
  common property; nothing was copied from a published list, gloss or example.
- The authoring fork rewrote two items it found genuinely ambiguous during
  self-review (a garbled idiom stem; a phrasal-verb item where both _look
  into_ and _look over_ fit → now unambiguous).

## Provenance

`WIKIBOOKS_ENGLISH_GRAMMAR` (`open_adaptable`, CC BY-SA) on every factual
block; `GUTENBERG_GRAMMAR` (`public_domain`) as a secondary cross-check on
`one-word-substitution` and `phrasal-verbs`; `SATHEE_ENGLISH` (`scope_only`)
for question-type confirmation only. All already in
`content/source-registry.json`.

## Open items for the human reviewer

1. Spot-check these keys (flagged by the author as having a defensible-looking
   distractor):
   - `synonyms-and-antonyms-in-context` P1 — _curtail_ → "cut back", not
     "cancel" (curtail = reduce/shorten, not stop outright).
   - `one-word-substitution` P1 — "appointed to settle a dispute" →
     _arbitrator_ (binding), not _mediator_ (facilitates only).
   - `commonly-confused-words` P10 — offers "comprises / comprises of" to make
     the point that _comprise of_ is always wrong; confirm you want it framed
     that way.
2. `commonly-confused-words` overlaps a little with the `word-usage-and-word-swap`
   exam-skills topic by design — this one teaches the pair distinction, that
   one teaches the question format. Confirm the split is worth keeping.
3. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
