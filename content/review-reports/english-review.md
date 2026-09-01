# English — review report

**Scope:** `content/english/` — 8 launch topics (4 grammar foundations, 3 exam
skills, plus `subject-verb-agreement` from Phase 1).
**Date:** 2026-09-01
**Reviewer:** content-pipeline (author self-review + automated verification). An
independent human reviewer must still sign off before any topic leaves `draft`.

## Verification performed

- `node scripts/study-validate.mjs --dir content/english` — **0 errors, 0
  warnings**.
- Schema, unique stable keys, strictly increasing positions, one usable
  allowlisted source per factual block, no banned domains, no raw HTML / images
  / event handlers, no fabricated previous-year / official-question language —
  all passing.
- Every exercise item in a `worked_example` was written to have exactly one
  defensible answer under the stated context (§15 English check). The RC
  worked example uses an original ~90-word passage; both its questions are
  answerable only from that passage.
- Idempotent import verified: `study:import --dir content/english` ran clean;
  a second run reports `unchanged`.

## Validator refinement made in this batch

`exam_tip` was moved out of the "factual block needs a source" set in
`scripts/study-validate.mjs`. Exam strategy is author-created guidance
(spec §4.5, §16.9), like `warning`, `shortcut` and `summary`, and forcing a
citation onto it would be dishonest. Re-ran the full corpus afterwards: no
regression (no earlier topic used `exam_tip`).

## Per-topic result

| Topic                            | Chapter     | Blocks | Cards | Words | Class                                                    |
| -------------------------------- | ----------- | ------ | ----- | ----- | -------------------------------------------------------- |
| `subject-verb-agreement`         | grammar     | 9      | 8     | 1138  | PASS (source URL corrected to a verified Wikibooks page) |
| `parts-of-speech`                | grammar     | 8      | 7     | 747   | PASS                                                     |
| `tenses`                         | grammar     | 8      | 7     | 774   | PASS                                                     |
| `articles-and-determiners`       | grammar     | 8      | 7     | 733   | PASS                                                     |
| `prepositions`                   | grammar     | 8      | 7     | 847   | PASS                                                     |
| `error-detection`                | exam-skills | 8      | 7     | 864   | PASS                                                     |
| `sentence-improvement`           | exam-skills | 8      | 7     | 733   | PASS                                                     |
| `reading-comprehension-strategy` | exam-skills | 8      | 7     | 833   | PASS                                                     |

No topic is PASS_WITH_CHANGES or REJECT from the automated pass.

## Claims, originality and provenance

- All rules are stated in original wording. Sources: `WIKIBOOKS_ENGLISH_GRAMMAR`
  (`open_adaptable`, CC BY-SA 4.0) as the grammar cross-check, `GUTENBERG_GRAMMAR`
  (`public_domain`) for `tenses` and `articles-and-determiners` to confirm the
  traditional scheme only, and `SATHEE_ENGLISH` (`scope_only`) cited only to
  confirm the exam question formats — no SATHEE text, questions or explanations
  were used.
- Verified the cited Wikibooks pages exist:
  `English_Grammar/Basic_Parts_of_Speech/{Verbs,Adjectives,Prepositions,Determining_Parts_of_Speech}`
  and `English_Grammar/Subject_and_Predicate/Finding_the_Subject_of_a_Sentence`.
  There is no dedicated Wikibooks page for tenses/articles/agreement, so those
  topics also cite the collection where needed.
- Every example sentence, cloze/error item and the RC passage is newly written,
  in an office / banking register, and does not reproduce any source material.

## Open items for the human reviewer

1. Confirm Indian vs British English calls: `different from` (not `than`),
   `in hospital`, `senior to`. The topics state these explicitly and note where
   usage varies — check they match the house style.
2. Re-verify each `worked_example` has exactly one defensible answer,
   especially `error-detection` Item 1 and `reading-comprehension-strategy`
   Question 2.
3. Decide whether the four grammar topics near ~740 words need an extra
   worked example before publication.
4. Approve status change from `draft` — no pipeline agent may do this.
