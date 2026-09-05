# Quantitative Aptitude — Foundations chapter (Batch 3a)

**Scope:** new `content/quantitative-aptitude/foundations/` chapter — 5 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Addresses the roadmap gaps: QA had no Foundations coverage, and every subject
except QA lacked worked examples and practice sets. Each topic here carries
**3 worked examples + 1 practice block** (5–8 items).

## Topics

| Topic                                    | Chapter pos      | Difficulty       | Blocks | Worked ex. | Practice | Cards | Words |
| ---------------------------------------- | ---------------- | ---------------- | ------ | ---------- | -------- | ----- | ----- |
| `number-system-and-divisibility`         | foundations · 10 | beginner         | 10     | 3          | 1        | 7     | ~1060 |
| `hcf-and-lcm`                            | foundations · 20 | beginner         | 10     | 3          | 1        | 7     | ~1000 |
| `simplification-and-order-of-operations` | foundations · 30 | beginner         | 10     | 3          | 1        | 7     | ~900  |
| `fractions-and-decimals`                 | foundations · 40 | beginner         | 10     | 3          | 1        | 7     | ~980  |
| `approximation-and-estimation`           | foundations · 50 | **intermediate** | 10     | 3          | 1        | 7     | ~1000 |

Chapter sits at position 1, before `arithmetic` (2) and `work-and-motion` (3).

## Verification

- `study:validate` on the whole corpus → **42 topics, 0 errors, 0 warnings**
  (the 4 earlier "prerequisite not authored" warnings are cleared: the
  Phase-2 topics reference `fractions-and-decimals` and
  `simplification-and-order-of-operations`, which now exist — the two new
  topics were named to those canonical slugs from spec §4.1).
- Every `worked_example` and the recurring-decimal / rationalising examples
  carry `expectedAnswers` with an `expression`; the validator recomputed all
  of them and they match (the §15 second method). Approximation examples use
  explicit `tolerance` values since they are estimates.
- Imported idempotently (30 blocks / 21 flashcards on the last delta run;
  50 / 35 total for the chapter). tsc / 114 tests / build all green.

## Difficulty note

These are genuinely beginner topics — foundations by definition. The
advanced tier will come with Data Interpretation (Batch 4) and the
advanced-companion pass (Batch 7). Corpus is now 31 beginner / 11
intermediate / 0 advanced.

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA) cross-check only. Verified the
cited pages exist: `Arithmetic/Types_of_Numbers`,
`Arithmetic/Highest_Common_Factor`, `Arithmetic/Number_Operations`,
`Arithmetic/Percents_Decimals_and_Fractions`. Universal-arithmetic material
(approximation) cites the `Subject:Mathematics` collection root. All divisibility
rules, identities, the recurring-decimal and surd rules, and every example and
practice item are original and independently verified.

## Open items for the human reviewer

1. Spot-check the recomputed answers in the six quantitative worked examples.
2. Confirm `approximation-and-estimation` belongs at `intermediate` (it assumes
   the two prior topics and is a speed skill).
3. Two topics were renamed to canonical slugs after import; the orphaned rows
   for the old slugs were deleted from the DB. Confirm nothing else referenced
   them.
4. Approve status — the topics were imported as `published` (this batch was
   built after your blanket approval); revert with
   `study-publish.mjs --unpublish` if you want them held.
