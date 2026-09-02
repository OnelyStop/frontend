# Beginner-topics polish pass (Batch 7z)

**Scope:** additive enhancement of 30 already-published beginner topics across
Quantitative Aptitude, English, Computer awareness and Banking awareness.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author + a semantic-diff verification pass).
Human subject review still required.

Raises every beginner topic to the same example bar the newer batches use:
at least one worked demonstration and a practice block of 8 single-answer
items. **No content was rewritten** — the pass is append-only.

## What changed

| Change                                                                             | Topics                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New `worked_example` block added (topic had neither worked_example nor comparison) | 5 — `input-and-output-devices`, `operating-systems-and-software`, `deposit-accounts`, `rbi-functions`, `payment-systems-neft-rtgs-imps-upi`                                                                                                                                                                                                                                                                                         |
| New `practice` block added (topic had none)                                        | 8 — `ratio-and-proportion`, `simple-interest`, `profit-loss-and-discount`; `parts-of-speech`, `subject-verb-agreement`, `articles-and-determiners`, `tenses`, `prepositions`; plus the 5 computer/banking topics above and `types-of-banks-in-india`, `structure-of-the-indian-financial-system`, `computer-networks`, `computer-fundamentals-and-functional-units`, `memory-and-storage`, `number-systems-and-data-representation` |
| Existing `practice` block grown to 8 items                                         | 11 — the 5 QA `foundations` topics, `percentages`, `average`; `pronouns`, `sentence-structure`, `adjectives-adverbs-and-modifiers`, `descriptive-paper-overview`                                                                                                                                                                                                                                                                    |

QA new items carry recomputed `expectedAnswers`; English/Computer/Banking
items are prose-reasoned with a one-line reason, matching each file's style.

## Verification

- **Semantic diff check** (HEAD vs working tree, parsed): for all 30 files —
  no block dropped, no existing block's `type`/`title`/`markdown`/`position`
  changed, no top-level field changed (`contentVersion` stays `1`,
  difficulty/summary/prerequisites intact), no flashcard dropped or altered.
  The only modifications are the appended blocks and the extended
  `practice.markdown` strings.
- `study:validate` (full corpus, after in-place import) → **123 topics,
  0 errors**, 1 pre-existing warning (`para-jumbles` word count).
- `study-import` updated 20 topic versions in place (source-hash change on
  the same `contentVersion` 1) — idempotent on re-run.
- QA new `expectedAnswers` recomputed: e.g. largest 3-digit ÷ 17 → 986;
  `5050 % 7` → 3; `LCM(6,9,15)+4` → 94; `1.25·0.80` → 1.0 (0% net);
  `6·49 + 6·52 − 11·50` → 56.
- All new questions original, elementary, office/banking register.

## Open items for the human reviewer

1. These topics stay graded **beginner** — the pass only adds _more_
   elementary practice, it does not raise difficulty.
2. `arithmetic/compound-interest` (graded `intermediate`, so out of this
   pass's scope) is the one remaining topic with no `practice` block — worth
   a follow-up.
3. Approve status — the updated versions remain `published`;
   `study-publish.mjs --unpublish` to hold.
