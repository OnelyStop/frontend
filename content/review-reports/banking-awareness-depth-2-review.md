# Banking awareness — depth fill, part 2 (Batch 3c-2)

**Scope:** 5 new topics in `content/banking-awareness/`, one new chapter.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required — see "Figures to re-verify" and
"Registry additions" below.

Completes the banking-depth roadmap: markets, development institutions, the
credit-product taxonomy, government schemes, and the NPA-resolution routes.

## Topics

| Topic                                | Chapter / pos                           | Difficulty   | Blocks | Cards | Words |
| ------------------------------------ | --------------------------------------- | ------------ | ------ | ----- | ----- |
| `money-market-and-capital-market`    | `markets-and-institutions` (6) / 10     | **advanced** | 9      | 8     | ~1294 |
| `development-financial-institutions` | `markets-and-institutions` (6) / 20     | intermediate | 7      | 7     | ~864  |
| `credit-and-loan-products`           | `products` (existing) / 60              | intermediate | 10     | 8     | ~1337 |
| `government-financial-schemes`       | `central-banking` (existing) / 50       | intermediate | 7      | 7     | ~1008 |
| `npa-resolution-and-recovery`        | `prudential-regulation` (existing) / 30 | **advanced** | 9      | 8     | ~1367 |

New chapter `markets-and-institutions` ("Financial markets and institutions"),
`chapterPosition` 6. Existing chapter positions unaffected.
`npa-resolution-and-recovery` links `asset-quality-and-npas` as a prerequisite.
Banking Awareness now has 19 topics across 6 chapters.

## Verification

- `study:validate` (full corpus, after import) → **0 errors** for all 5 files.
- Imported idempotently (`study-import --dir content/banking-awareness`):
  5 versions, 42 blocks, 38 flashcards.
- `credit-and-loan-products` is the only topic with `expectedAnswers` — all
  recomputed: drawing power `(40+30−10)·(1−0.25)` = 45; max home loan
  `80·0.75` = 60; one month's interest `600000·0.12/12` = 6000; practice
  `(50+20−10)·0.8` = 48, `60·0.8` = 48, `900000·0.10/12` = 7500.
- Every other topic uses a `comparison` block plus an 8-item `practice` block
  (classify / which regulator / which route), single defensible answer + reason.
- All scenarios, institutions' mandates and case descriptions in original
  wording; scheme figures kept non-numeric or hedged by design.

## Provenance

Every factual block cites only IDs already in `content/source-registry.json`:
`RBI_ROLES`, `RBI_MASTER_DIRECTIONS`, `RBI_FAME`, `RBI_HOME`,
`INDIACODE_BANKING_ACT` (all `reference_only`), with `SATHEE_BANK`
(`scope_only`) as secondary scope confirmation. **No invented source IDs** —
the validator hard-errors on any unregistered `sourceId`, so the marked
non-registry entries the brief suggested were not possible.

## Registry additions a human should make before merge

- **SEBI** (sebi.gov.in) — capital-market regulation split
  (`money-market-and-capital-market`).
- India Code entries for **SARFAESI Act 2002 / RDDBFI Act 1993 / IBC 2016** —
  currently cited only via the generic `INDIACODE_BANKING_ACT` handle
  (`npa-resolution-and-recovery`, `credit-and-loan-products`).
- Scheme portals — **mudra.org.in, standupmitra.in, cgtmse.in,
  pmsvanidhi.mohua.gov.in**, a KCC/agri portal
  (`government-financial-schemes`).
- **NHB / NaBFID** official pages (`development-financial-institutions`).
- RBI **Prudential Framework for Resolution of Stressed Assets (June 2019)**
  direct notification (`npa-resolution-and-recovery`).

## Figures to re-verify (kept hedged in-text, still worth a check)

- T-bill tenors 91/182/364 days; notice-money band 2–14 days.
- The 2019 transfer of HFC regulation to the RBI (in the markets **and** DFI
  topics); NaBFID's mandate wording.
- SARFAESI 60-day demand-notice period (in two topics); exclusion of
  agricultural land.
- `government-financial-schemes` — written to avoid all rupee ceilings; MUDRA
  tiers named with a note the bands were revised and a tier added; CGTMSE
  ceiling described only as "raised several times". Every scheme number
  flagged in-text as revisable.
- IBC threshold amount and CIRP day-counts are described, not quoted;
  June-2019 framework date.

## Open items

1. Confirm `markets-and-institutions` chapter name/position 6.
2. Confirm the two `advanced` gradings
   (`money-market-and-capital-market`, `npa-resolution-and-recovery`).
3. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
