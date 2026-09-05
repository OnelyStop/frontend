# English — Grammar chapter fill (Batch 3b-i)

**Scope:** 5 new topics in `content/english/grammar/`.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Fills the grammar-foundations gaps identified in the roadmap and applies the
new example bar (≥1 worked example + a practice block per topic).

## Topics

| Topic                              | Position | Difficulty       | Blocks | Worked ex. | Practice    | Cards | Words |
| ---------------------------------- | -------- | ---------------- | ------ | ---------- | ----------- | ----- | ----- |
| `sentence-structure`               | 15       | beginner         | 8      | 1          | ✓ (6 items) | 7     | 828   |
| `pronouns`                         | 25       | beginner         | 9      | 1          | ✓ (6 items) | 7     | 984   |
| `adjectives-adverbs-and-modifiers` | 45       | beginner         | 9      | 1          | ✓ (6 items) | 7     | 1012  |
| `conjunctions-and-connectors`      | 50       | **intermediate** | 9      | 1          | ✓ (6 items) | 7     | 922   |
| `parallelism`                      | 60       | **intermediate** | 9      | 1          | ✓ (6 items) | 7     | 958   |

English grammar chapter now has 10 topics.

## Verification

- `study:validate` on the whole corpus → **47 topics, 0 errors, 0 warnings**.
- Every exercise (worked examples and practice items) was written to have
  **exactly one defensible answer** under the stated context (§15). Each is a
  choose/fix task with a stated reason.
- All example sentences are original, in an office / banking register; no source
  sentence, table or explanation is reproduced.
- Imported idempotently (44 blocks / 35 flashcards). tsc / 114 tests / guards /
  layout all green.

## Provenance

`WIKIBOOKS_ENGLISH_GRAMMAR` (`open_adaptable`, CC BY-SA) as the grammar
cross-check; `parallelism` also cites `GUTENBERG_GRAMMAR` (`public_domain`) for
the comparison principle only. Verified the cited Wikibooks pages exist:
`English_Grammar/Subject_and_Predicate/What_is_a_Sentence`,
`.../Basic_Parts_of_Speech/{Pronouns,Adjectives,Conjunctions}`.

## Difficulty note

`conjunctions-and-connectors` and `parallelism` are graded `intermediate`: they
assume `sentence-structure` and `parts-of-speech`, and they carry the
multi-way "choose the connector by meaning" and "check both halves" reasoning
that error-detection and sentence-improvement questions lean on. The first
_advanced_ English topic (`para-jumbles`) is in the next sub-batch (3b-ii,
exam skills). Corpus is now 34 beginner / 13 intermediate / 0 advanced.

## Open items for the human reviewer

1. Re-verify a single defensible answer for each practice item, especially the
   "fix" items (5, 6) in each topic.
2. Confirm Indian/British usage calls: `whom` retained as the object form,
   `that` vs `which` restrictive/non-restrictive, `different from`.
3. Confirm `conjunctions-and-connectors` and `parallelism` at `intermediate`.
4. Approve status — imported as `published` (built after blanket approval);
   `study-publish.mjs --unpublish` to hold.
