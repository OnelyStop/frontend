# Reasoning Ability — advanced puzzles & logic chapter (Batch 5c)

**Scope:** third chapter `advanced-puzzles-and-logic` under `reasoning-ability`
— 6 topics.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + verification pass).
Human subject review still required.

## Topics

| Topic                               | Position | Difficulty   | Blocks | Cards | Words |
| ----------------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `coded-inequalities`                | 10       | intermediate | 8      | 7     | ~1030 |
| `syllogism-possibility-and-reverse` | 20       | **advanced** | 9      | 7     | ~1215 |
| `input-output-machine`              | 30       | **advanced** | 9      | 7     | ~1060 |
| `data-sufficiency-reasoning`        | 40       | **advanced** | 7      | 7     | ~915  |
| `logical-connectives`               | 50       | intermediate | 7      | 7     | ~767  |
| `decision-making-and-eligibility`   | 60       | intermediate | 8      | 6     | ~1057 |

Chapter `chapterPosition` 3. Subject-level fields copied verbatim from
`box-and-floor-puzzles.topic.json`. Reasoning Ability now has **20 topics
across 3 chapters**.

## Verification

- `study:validate` (full corpus, after import) → **0 errors** for all 6 files.
- Imported idempotently: 6 versions, 48 blocks, 41 flashcards.
- No numeric `expectedAnswers` in this batch — all prose-reasoned, one
  defensible answer + one-line reason per item.
- **`input-output-machine`** — both worked-example machines and the practice
  machine were traced step by step; each rule (largest number to the front /
  next word alphabetically to the rear / smallest number to the front) forces
  a unique step sequence, and each completes in 4 steps.
- **`data-sufficiency-reasoning`** — the 7 practice verdicts were re-derived
  (a / b / c / d / e per the topic's option scheme):
  1 b · 2 b · 3 e · 4 c · 5 d · 6 a · 7 d. Each checked by testing statement I
  alone, then II alone, then together, stopping at unique determination.

## Correction to note (content is fine; the key needs one fix on record)

**`coded-inequalities` practice item 4** — statements `X % Y`, `Y & Z`
(`X < Y ≤ Z`). This gives `X < Z` definitely, so conclusion II (`Z # X` =
`Z > X`) **follows** and conclusion I (`X > Z`) is false → the answer is
**"only II"**, not "either I or II". (The authoring fork mis-stated this one
as either-or in its hand-off; the topic text itself only poses the question
and publishes no key, so nothing in the shipped content is wrong — but the
tutor/answer key should record "only II".) Independent read of the full
practice key:

| Item | Answer         | Reason                                                       |
| ---- | -------------- | ------------------------------------------------------------ |
| 1    | both           | `A > B ≥ C` → `A > C`; `C < A` says the same                 |
| 2    | neither        | `P > Q ≥ R` → `P > R`; both `R > P` and `P = R` are false    |
| 3    | either I or II | `L ≥ M ≥ N` → `L ≥ N`; `>` and `=` are complementary         |
| 4    | only II        | `X < Y ≤ Z` → `X < Z`; `Z > X` follows, `X > Z` false        |
| 5    | only I         | `D = E ≤ F` → `F ≥ D`; `F > D` not definite                  |
| 6    | either I or II | `G ≤ H > K` broken at H; `G > K` and `K ≥ G` cover all cases |
| 7    | both           | `R ≥ S > T ≥ U` → `R > T` and `R > U`                        |

## Provenance

`WIKIBOOKS_MATH` (`open_adaptable`, CC BY-SA — logic cross-check),
`WIKIBOOKS_COPYRIGHT` (`policy`), `SATHEE_BANK` (`scope_only`, question-type
confirmation only). All already in `content/source-registry.json`.

## Open items for the human reviewer

1. Record the `coded-inequalities` item-4 key as "only II" (above).
2. Confirm the `coded-inequalities` either-or convention (items 3, 6) matches
   your house rule — some sets reject "either-or" entirely and would mark
   those "neither".
3. Confirm the three `advanced` gradings.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
