# Quantitative Aptitude — review report

**Scope:** `content/quantitative-aptitude/` — 8 launch topics.
**Date:** 2026-09-01
**Reviewer:** content-pipeline (author self-review + automated verification). An
independent human subject reviewer must still sign off before any topic moves
past `draft` (spec §13.8, §14).

## Verification performed

- `node scripts/study-validate.mjs --dir content/quantitative-aptitude` — **0 errors**,
  5 warnings (all "prerequisite X is not an authored topic yet" for foundation
  topics outside this launch subset: `fractions-and-decimals`, `hcf-and-lcm`,
  `simplification-and-order-of-operations`).
- Every `worked_example` in every topic carries `expectedAnswers` with an
  `expression`; the validator recomputes each expression and matched every
  declared value within tolerance. This is the "second independent method"
  required by §15 for Quantitative Aptitude.
- Schema, unique stable keys, strictly increasing positions, one usable
  allowlisted source per factual block, no banned domains, no raw HTML / images
  / event handlers, no fabricated previous-year / official-question claims —
  all enforced by the validator and passing.
- Idempotent import verified: `study:import` ran clean; a second run reports
  `unchanged`.

## Per-topic result

| Topic                      | Blocks | Cards | Words | Class             | Notes                                                                |
| -------------------------- | ------ | ----- | ----- | ----------------- | -------------------------------------------------------------------- |
| `percentages`              | 9      | 8     | 1186  | PASS              | source URL corrected to a verified Wikibooks page                    |
| `ratio-and-proportion`     | 9      | 8     | 1010  | PASS              |                                                                      |
| `average`                  | 9      | 8     | 842   | PASS              |                                                                      |
| `profit-loss-and-discount` | 8      | 8     | 718   | PASS              |                                                                      |
| `simple-interest`          | 8      | 7     | 668   | PASS_WITH_CHANGES | lean prose; consider one more concept block on installments          |
| `compound-interest`        | 8      | 7     | 643   | PASS_WITH_CHANGES | near the 600 floor; a worked example on 3-year CI would help         |
| `time-and-work`            | 8      | 7     | 672   | PASS_WITH_CHANGES | add an "alternating days" worked example if space allows             |
| `time-speed-and-distance`  | 8      | 7     | 645   | PASS_WITH_CHANGES | near the floor; boats-and-streams cross-link noted for a later topic |

No topic is REJECT.

## Claims and provenance

- All formulas are stated in original wording. Sources are cited only as
  cross-checks; `WIKIBOOKS_MATH` is `open_adaptable` (CC BY-SA 4.0) and every
  `sources[]` entry records `retrievedAt`, `usageMode` and `adapted: false`.
- Verified that `en.wikibooks.org/wiki/Arithmetic/Percents_Decimals_and_Fractions`,
  `.../Ratios,_Proportions,_and_Their_Uses` and `.../Financial_Math_FM/Formulas`
  resolve (HTTP 200). Topics whose facts are universal arithmetic
  (`average`, `time-and-work`, `time-speed-and-distance`) cite the collection
  root `.../Subject:Mathematics` (the registry URL) rather than a single page.
- No worked example reproduces a source example with numbers changed; every
  scenario (welfare fund, courier trip, two trains, fee concession, etc.) is
  newly constructed.

## Open items for the human reviewer

1. Confirm the exam relevance of the difficulty labels (`percentages`,
   `ratio-and-proportion`, `average` marked `beginner`; `compound-interest`
   marked `intermediate`).
2. Decide whether the four `PASS_WITH_CHANGES` topics need the suggested extra
   block before publication, or pass as-is at ~650 words.
3. Spot-check two or three flashcards per topic for atomicity (one fact each).
4. Approve status change from `draft` — no pipeline agent may do this.
