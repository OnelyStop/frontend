# Banking Awareness — review report

**Scope:** `content/banking-awareness/` — 9 evergreen topics (target was 8;
`kyc-and-aml-basics` added for coverage across the four §4.3 groups).
**Date:** 2026-09-01
**Reviewer:** content-pipeline (author self-review + live-source verification).
An independent human subject reviewer must still sign off; banking content also
needs a freshness re-check before publication.

## Verification performed

- `node scripts/study-validate.mjs --dir content/banking-awareness` — **0
  errors, 0 warnings**.
- Every topic carries `lastReviewedAt` = 2026-09-01 and a `reviewCadenceDays`
  of 180 (rate/scheme-sensitive topics) or 365 (pure-concept topics), per §15.
- Schema, unique keys, sorted positions, one usable `reference_only` source per
  factual block, no banned domains, no raw HTML, no fabricated exam-provenance
  language — all passing.
- Idempotent import verified: `study:import --dir content/banking-awareness`
  ran clean; a second run reports all 9 `unchanged`.

## Live-source checks (retrieved 2026-09-01)

| Fact                    | Value used                                                 | Source                      | Volatile?                                      |
| ----------------------- | ---------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| Policy repo / SDF / MSF | 5.25% / 5.00% / 5.50%                                      | rbi.org.in home rates panel | yes — flagged in `monetary-policy-instruments` |
| CRR / SLR               | 3.00% / 18.00% of NDTL                                     | rbi.org.in                  | yes — flagged                                  |
| DICGC cover             | principal + interest, ₹5,00,000 per depositor per bank     | dicgc.org.in/FAQs           | yes — flagged in `deposit-accounts`            |
| RTGS minimum / hours    | ₹2,00,000, no ceiling, 24x7x365 (since Dec 2020)           | RBI RTGS FAQ                | yes — flagged                                  |
| NEFT                    | half-hourly batches, no RBI min/max, 24x7 (since Dec 2019) | RBI NEFT FAQ                | limits flagged                                 |

Every numeric limit, ratio and named threshold in these topics is explicitly
marked volatile in a `warning` block and in `quick-revision`, with an
instruction to re-verify on the primary site (§15).

## Per-topic result

| Topic                                             | Chapter         | Blocks | Cards | Words | Class |
| ------------------------------------------------- | --------------- | ------ | ----- | ----- | ----- |
| `structure-of-the-indian-financial-system`        | banking-system  | 7      | 7     | 664   | PASS  |
| `types-of-banks-in-india`                         | banking-system  | 7      | 7     | 728   | PASS  |
| `rbi-functions`                                   | central-banking | 7      | 7     | 668   | PASS  |
| `monetary-policy-instruments`                     | central-banking | 8      | 7     | 860   | PASS  |
| `priority-sector-lending-and-financial-inclusion` | central-banking | 7      | 7     | 740   | PASS  |
| `deposit-accounts`                                | products        | 7      | 7     | 762   | PASS  |
| `negotiable-instruments`                          | products        | 8      | 7     | 902   | PASS  |
| `kyc-and-aml-basics`                              | products        | 7      | 7     | 826   | PASS  |
| `payment-systems-neft-rtgs-imps-upi`              | payment-systems | 8      | 7     | 823   | PASS  |

No topic is PASS_WITH_CHANGES or REJECT from the automated + live-check pass.

## Provenance and originality

- All sources are RBI / DICGC / India Code, used `reference_only`: facts were
  cross-checked and then explained in original wording. No RBI/DICGC text,
  tables or FAQ answers were reproduced or closely paraphrased.
- BIS is not cited; Indian implementation is drawn from RBI material only, per
  §15.
- No previous-year, "asked in" or official-question language anywhere.
- `sourceUpdatedAt` recorded where the primary page showed a revision date
  (RBI RTGS FAQ: 2021-01-07; DICGC FAQ: retrieval date).

## Open items for the human reviewer

1. Re-verify the five live facts in the table above against the primary sites
   on the day of publication; update `lastReviewedAt` if changed.
2. Confirm the review cadence choices (180 vs 365 days) match house policy.
3. Decide whether to keep 9 topics or trim to the 8-topic target (candidate to
   defer: `kyc-and-aml-basics`, the newest area to move).
4. Check the statutory citations (RBI Act 1934 schedule, NI Act 1881 parties,
   PSS Act 2007, PMLA 2002) against the current consolidated texts on
   indiacode.nic.in.
5. Approve status change from `draft` — no pipeline agent may do this.
