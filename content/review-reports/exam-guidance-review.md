# Exam Guidelines and Strategy — review report

**Scope:** `content/exam-guidance/` — 4 stable strategy topics.
**Date:** 2026-09-01
**Reviewer:** content-pipeline (author self-review + automated verification). An
independent human reviewer must still sign off before any topic leaves `draft`.

## Verification performed

- `node scripts/study-validate.mjs --dir content/exam-guidance` — **0 errors,
  0 warnings**.
- `negative-marking-strategy` has a `worked_example` whose `expectedAnswers`
  (57.5, 51.25, 57 from the penalty arithmetic) are recomputed by the validator
  and match.
- Idempotent import verified: `study:import --dir content/exam-guidance` ran
  clean; a second run reports `unchanged`.

## Validator refinement made in this batch

For `subjectSlug === "exam-guidance"`, a factual block may now cite a
`scope_only` source. The only allowlisted sources for exam structure and rules
are the official SBI/IBPS pages, which the registry marks `scope_only` and which
spec §5.2 explicitly permits for cross-checking "phases, named sections and
general rules". Every other subject still requires a non-`scope_only` source on
a factual block. Full corpus re-validated afterwards — no regression. The
`expectedAnswers` recompute was also broadened to run for any block that
declares them, not only Quantitative Aptitude.

## Per-topic result

| Topic                       | Blocks | Cards | Words | Class |
| --------------------------- | ------ | ----- | ----- | ----- |
| `prelims-versus-mains`      | 7      | 7     | 761   | PASS  |
| `negative-marking-strategy` | 7      | 7     | 744   | PASS  |
| `sectional-time-management` | 6      | 7     | 662   | PASS  |
| `mock-test-analysis`        | 7      | 7     | 718   | PASS  |

No topic is PASS_WITH_CHANGES or REJECT.

## Compliance with §4.5 and §15

- These are the **stable strategy pages** from §4.5, not the cycle-specific
  factual pages. None carries an `examCycle` or `officialNotificationUrl`, and
  none states a cycle-specific fact.
- **Strategy is framed as guidance, never as an official rule or a guarantee of
  selection.** Every topic says so explicitly, in the intro or the
  common-mistakes / quick-revision block, and repeatedly directs the reader to
  the current notification as the only authority for structure, timing,
  sections, negative marking and cut-offs.
- The one-fourth negative-marking convention and the two-stage
  prelims/mains structure are cross-checked against `SBI_PO_OVERVIEW` and
  `IBPS_HOME` (`scope_only`), with a note that the current notification governs.
  No text from those pages was reused.
- No previous-year or official-question language.

## Open items for the human reviewer

1. Confirm the four topics chosen match the launch priority; the other §4.5
   strategy titles (accuracy vs attempts, revision planning, question selection,
   last-week preparation, exam-day checklist) are candidates for a later batch.
2. Verify the negative-marking arithmetic example and its `expectedAnswers`.
3. Check that the "guidance, not a rule / no guarantee" framing is strong
   enough for a commercial launch, per §4.5.
4. Consider whether a short cycle-specific "SBI PO exam structure" factual page
   (with `examCycle` + `officialNotificationUrl`, retrieved at run time) should
   accompany these, as §4.5 describes — deferred here because it needs a live
   notification and a human to confirm the current cycle.
5. Approve status change from `draft` — no pipeline agent may do this.
