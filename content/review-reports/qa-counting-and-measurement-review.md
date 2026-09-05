# Quantitative Aptitude — counting & measurement (Batch 7q)

**Scope:** 7 topics — a new `mensuration` chapter (3), a new
`counting-and-probability` chapter (2), and 2 topics added to the existing
`arithmetic` chapter.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author + independent arithmetic re-check).
Human subject review still required.

Fills the largest QA gap: the corpus previously had no mensuration, no
permutations/probability, no mixtures, no partnership.

## Topics

| Topic                                      | Chapter / pos                       | Difficulty   | Blocks | Cards | Words |
| ------------------------------------------ | ----------------------------------- | ------------ | ------ | ----- | ----- |
| `areas-and-perimeters`                     | `mensuration` (5) / 10              | intermediate | 9      | 7     | 1066  |
| `surface-area-and-volume`                  | `mensuration` (5) / 20              | intermediate | 9      | 7     | 971   |
| `paths-cross-sections-and-cost`            | `mensuration` (5) / 30              | intermediate | 8      | 7     | 963   |
| `factorials-permutations-and-combinations` | `counting-and-probability` (6) / 10 | **advanced** | 9      | 7     | 972   |
| `probability`                              | `counting-and-probability` (6) / 20 | **advanced** | 9      | 7     | 829   |
| `mixtures-and-alligation`                  | `arithmetic` (2) / 70               | intermediate | 9      | 7     | 999   |
| `partnership-and-share-of-profit`          | `arithmetic` (2) / 80               | intermediate | 8      | 6     | 896   |

**Chapter placement change from the brief:** the authoring fork put
`mixtures-and-alligation` and `partnership-and-share-of-profit` in
`counting-and-probability`, then flagged that they are ratio-applications, not
counting. Moved both into the existing `arithmetic` chapter (positions 70, 80,
after compound-interest = 60) before import — a browser looking under
"Counting and probability" would not expect them. No content change.

## Verification

- `study:validate` (full corpus, after import) → **0 errors** for all 7 files.
- Imported idempotently (`study-import --dir content/quantitative-aptitude`):
  7 versions, 61 blocks, 48 flashcards.
- **Every topic carries a `worked_example` and an 8-item `practice` block,
  all with `expectedAnswers`. All 68 expressions were recomputed with `node`
  by the author and again by the validator.** Spot checks:
  circle area `(22/7)*21**2` = 1386; sphere `(4/3)*(22/7)*3**3` = 113.14;
  path area `50*34 − (50−4)*(34−4)` = 320; `LEVEL` arrangements
  `5!/(2!·2!)` = `120/(2*2)` = 30; decagon diagonals `10·9/2 − 10` = 35;
  replacement `50·(1−5/50)**2` = 40.5; partnership split
  `17000·(50000·8)/(40000·12 + 50000·8)` = 7727.27.
- All problems original, real-world/office register.
- π convention stated per block (22/7 or 3.14159); non-exact items carry an
  explicit `tolerance`.

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA) as the formula/method
cross-check; `SATHEE_BANK` (`scope_only`, question-type confirmation only).
Both already in `content/source-registry.json`. No new sources.

## Open items for the human reviewer

1. Confirm `factorials-permutations-and-combinations` and `probability` at
   `advanced`; the other five at `intermediate`.
2. Confirm the two new chapter names/positions (`mensuration` 5,
   `counting-and-probability` 6) and the move of mixtures/partnership into
   `arithmetic`.
3. Re-verify the P&C and probability keys — `factorials-permutations-and-combinations`
   practice items 6–8 (circular, polygon diagonals, restricted arrangements)
   carry the most setup.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
