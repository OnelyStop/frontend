# Quantitative Aptitude — algebra chapter (Batch 7a2)

**Scope:** new `algebra` chapter under QA — 5 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author + independent arithmetic re-check).
Human subject review still required.

Adds the algebra QA had no coverage of — identities, linear and quadratic
equations, surds/indices, and the arithmetic number-series format.

## Topics

| Topic                                  | Position | Difficulty   | Blocks | Cards | Words |
| -------------------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `algebraic-expressions-and-identities` | 10       | intermediate | 9      | 7     | 1124  |
| `linear-equations`                     | 20       | intermediate | 9      | 7     | 1039  |
| `quadratic-equations`                  | 30       | **advanced** | 10     | 7     | 1206  |
| `surds-indices-and-exponents`          | 40       | intermediate | 10     | 7     | 1020  |
| `number-series-quant`                  | 50       | intermediate | 8      | 7     | 903   |

Chapter `algebra`, `chapterPosition` 7. Subject fields copied from
`arithmetic/percentages.topic.json`. QA now has 7 chapters.
`number-series-quant` is scoped to arithmetic pattern-spotting, distinct from
the `number-and-alphabet-series` reasoning topic.

## Verification

- `study:validate` (full corpus, after import) → **0 errors** for all 5 files.
- **All 61 `expectedAnswers` expressions recomputed independently** — every one
  matches. Spot checks: `(a+b)³−3ab(a+b)` as `7**3 − 3*10*7` = 133;
  quadratic formula `(7 ± ((-7)**2 − 4*1*12)**0.5)/(2*1)` → 4, 3;
  `27**(2/3) + 16**0.75` = 17; `7**6 / (7**3 * 7**2)` = 7;
  sum of roots `-(-12)/3` = 4, product `7/3` = 2.333 (tol 0.001).
- `formula` blocks carry the actual identities and index laws.
- Irrational results carry an explicit `tolerance`; operator precedence in
  `-b/a` style expressions written with numbers plugged in and parenthesised.
- All problems original, banking/office register.

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA) as the identity/method
cross-check; `WIKIBOOKS_COPYRIGHT` (`policy`); `SATHEE_BANK` (`scope_only`,
question-type confirmation only). All already in
`content/source-registry.json`. No new sources.

## Open items for the human reviewer

1. Confirm `quadratic-equations` at `advanced`, the other four at
   `intermediate`.
2. Re-verify the `quadratic-equations` root-comparison worked example (the
   "compare the roots of two quadratics" bank format) and practice items
   4–8 (sum/product of roots, discriminant, forming from roots).
3. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
