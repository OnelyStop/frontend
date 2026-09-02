# Banking awareness — depth fill (Batch 3c)

**Scope:** 5 new topics in `content/banking-awareness/`, one new chapter.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required — see "Figures to re-verify" below.

Addresses the "corpus has no hard topics" gap for banking: two advanced
topics on prudential regulation, plus three intermediate topics on the
depositor-protection and inclusion side.

## Topics

| Topic                                       | Chapter (pos)                     | Position | Difficulty   | Blocks | Cards | Words |
| ------------------------------------------- | --------------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `asset-quality-and-npas`                    | `prudential-regulation` (5) _new_ | 10       | **advanced** | 10     | 9     | 1335  |
| `basel-norms-and-capital-adequacy`          | `prudential-regulation` (5) _new_ | 20       | **advanced** | 10     | 8     | 1095  |
| `deposit-insurance-dicgc`                   | `products` (existing)             | 40       | intermediate | 9      | 7     | 1033  |
| `banking-ombudsman-and-grievance-redressal` | `products` (existing)             | 50       | intermediate | 8      | 8     | 1030  |
| `financial-inclusion-schemes`               | `central-banking` (existing)      | 40       | intermediate | 9      | 8     | 935   |

New chapter `prudential-regulation` ("Prudential regulation and risk"),
chapterPosition 5 (after `payment-systems` = 4). No slug/path/position
collisions. Prereq links resolve to `types-of-banks-in-india`,
`asset-quality-and-npas` (→ Basel), `deposit-accounts`,
`priority-sector-lending-and-financial-inclusion`.

## Verification

- `study:validate` (full corpus, after import) → **0 errors, 0 warnings** for
  all 5 files.
- Imported idempotently (`study-import --dir content/banking-awareness`):
  5 versions created, 46 blocks, 40 flashcards.
- **Arithmetic re-checked independently during review** — all correct:
  - NPAs: gross NPA ratio `800/10000*100` = 8%; net NPAs `800−500` = ₹300 cr;
    net NPA ratio `300/9500*100` = 3.16%; PCR `500/800*100` = 62.5%.
    Practice: PCR `390/600*100` = 65%; gross NPA ratio `1500/20000*100` = 7.5%.
  - Basel: CET1 `800/10000` = 8%; Tier 1 `900/10000` = 9%;
    CRAR `1250/10000` = 12.5%; min incl. CCB `9+2.5` = 11.5% ⇒ compliant.
    Practice: CRAR `450/5000` = 9%; RWA added `200*0.5` = ₹100 cr.
  - DICGC: individual-capacity at Bank X `200000+450000` = ₹6,50,000 → capped
    at ₹5,00,000 (₹1,50,000 uninsured); total insured
    `500000+300000+150000+400000` = ₹13,50,000.
- All datasets, depositor scenarios and grievance timelines are original.
  No source text, table or worked figure is reproduced.

## Provenance

Every factual block cites only IDs already in `content/source-registry.json`:
`RBI_HOME`, `RBI_MASTER_DIRECTIONS`, `RBI_FAME`, `RBI_OMBUDSMAN`,
`INDIACODE_BANKING_ACT`, `BIS_BASEL`, `DICGC_FAQ` — all `reference_only`.
No invented source IDs; no new source objects added.

## Recommended registry additions (human, before merge)

These would materially strengthen provenance; the topics currently lean on RBI
umbrella pages plus hedged prose:

- `jansuraksha.gov.in` — PMJJBY / PMSBY / APY official portal
  (`financial-inclusion-schemes`).
- `npscra.nsdl.co.in` or `pfrda.org.in` — APY contribution charts (same).
- `pmjdy.gov.in` — PMJDY scheme details / OD limits (same).
- RBI **Integrated Ombudsman Scheme, 2021** notification (not just the FAQ)
  (`banking-ombudsman-and-grievance-redressal`).
- `dicgc.org.in` settlement pages beyond the FAQ (`deposit-insurance-dicgc`).

## Figures to re-verify (each flagged in a warning block in-topic)

- **DICGC:** ₹5 lakh cap (principal + interest, per depositor per bank per
  capacity); the 45 + 45-day interim-payout split.
- **Ombudsman:** ₹20 lakh / ₹1 lakh compensation ceilings; the "1 year from
  reply" / "1 year + 30 days if no reply" filing windows; Appellate Authority
  at Deputy Governor rank.
- **PMJJBY / PMSBY / APY:** cover amounts, annual premiums, age bands,
  government co-contribution.
- **Basel / RBI minimums:** CET1 5.5%, Tier 1 7%, total CRAR 9%, CCB 2.5%.

## Open items

1. Confirm the `prudential-regulation` chapter name and position 5.
2. Confirm both advanced topics at `advanced` (they assume
   `types-of-banks-in-india` and carry multi-step ratio computation).
3. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
