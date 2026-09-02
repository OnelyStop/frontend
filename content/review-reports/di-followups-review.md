# Data Interpretation — follow-up formats (Batch 4b)

**Scope:** 4 topics added to the existing `data-interpretation` chapter (QA).
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author + independent arithmetic re-check).
Human subject review still required.

Covers the DI question formats the first DI batch left out.

## Topics

| Topic                             | Position | Difficulty   | Blocks | Cards | Words |
| --------------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `missing-number-di`               | 70       | intermediate | 7      | 7     | ~980  |
| `mixed-and-combined-di`           | 80       | **advanced** | 8      | 7     | ~1080 |
| `approximation-and-percentage-di` | 90       | intermediate | 8      | 7     | ~1040 |
| `quantity-comparison-di`          | 100      | **advanced** | 8      | 7     | ~1040 |

The `data-interpretation` chapter now has 10 topics.

## Verification

- `study:validate` (full corpus, after import) → **0 errors** for all 4 files.
- Imported idempotently: 4 versions, and every `expectedAnswers` expression
  recomputed by the validator.
- **Independently re-checked all 40+ numeric items.** Spot checks:
  `missing-number-di` P8 `(45−24)/24·100` = 87.5; `mixed-and-combined-di` WE
  `(1200·0.25)/600` = 0.5; `approximation-and-percentage-di` P3
  `(372−288)/288·100` = 29.17, P7 `372·1.125` = 418.5;
  `quantity-comparison-di` P5 QI `(12−6)/6·100` = 100 vs QII
  `(12−8)/8·100` = 50 → QI > QII.
- `quantity-comparison-di` practice items carry two `expectedAnswers` (QI, QII)
  and state the relation + reason in the markdown; each has exactly one
  correct relation.
- The authoring fork repaired one item mid-write
  (`approximation-and-percentage-di` P5: the two sums were the wrong way round
  for a positive answer — reworded so "May+June exceed Feb+March" = +45).
- All datasets original, banking/office register.

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA) as method cross-check;
`SATHEE_BANK` (`scope_only`, question-type confirmation only). Both already in
`content/source-registry.json`. No new sources.

## Open items for the human reviewer

1. Confirm `mixed-and-combined-di` and `quantity-comparison-di` at `advanced`.
2. Re-verify the `quantity-comparison-di` relations for the "no relation"
   possibility — every practice item here resolves to a strict `>`, `<` or
   `=`; a real set usually includes one indeterminate pair. Consider adding
   one.
3. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
