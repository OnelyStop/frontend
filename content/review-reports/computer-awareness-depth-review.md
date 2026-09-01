# Computer awareness — depth fill (Batch 3d)

**Scope:** 5 new topics in `content/computer-awareness/`.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Adds the applied / exam-frequent computer topics the corpus was missing:
productivity software, the web and email, the abbreviation set, emerging
technology concepts, and the attack/defence side of security.

## Topics

| Topic                                     | Chapter (pos)               | Position | Difficulty   | Blocks | Cards | Words |
| ----------------------------------------- | --------------------------- | -------- | ------------ | ------ | ----- | ----- |
| `computer-abbreviations-and-terminology`  | `fundamentals` (1)          | 50       | beginner     | 8      | 8     | ~965  |
| `ms-office-and-productivity-suites`       | `software-and-data` (2)     | 30       | intermediate | 10     | 8     | ~1145 |
| `emerging-technologies`                   | `software-and-data` (2)     | 40       | intermediate | 9      | 8     | ~1080 |
| `the-internet-web-and-email`              | `networks-and-security` (3) | 30       | intermediate | 10     | 9     | ~1280 |
| `information-security-basics-and-attacks` | `networks-and-security` (3) | 40       | intermediate | 9      | 8     | ~1250 |

All slot into existing chapters at free positions; no slug/path/position
collisions. `information-security-basics-and-attacks` is scoped to attacks +
safe-banking, with `cyber-security-basics` as a prerequisite, to avoid
re-deriving the CIA triad / encryption already covered there.

Computer awareness now has 13 topics.

## Verification

- `study:validate` (full corpus, after import) → 0 errors for all 5 files.
- Imported idempotently (`study-import --dir content/computer-awareness`):
  5 versions created, 46 blocks, 41 flashcards.
- **`ms-office` spreadsheet worked-example recomputed** (order sheet rows 2–4
  = Pens 12×5, Files 8×25, Markers 15×18): `D2:D4` = 60 / 200 / 270;
  `D5 =SUM` = 530; `E =IF(D>=200,"bulk","small")` → small / bulk / bulk;
  `COUNTIF(E2:E4,"bulk")` = 2; `F =D/$D$5` keeps the absolute ref on copy-down.
  All correct; all carried as `expectedAnswers` and recomputed by the validator.
- All examples original, office/banking register. Port numbers, shortcut keys
  and abbreviation expansions are standard facts, not reproduced text.

## Provenance

Every factual block cites only IDs already in `content/source-registry.json`:
`WIKIBOOKS_COMPUTING`, `NIST_GLOSSARY`, `LIBREOFFICE_GUIDES` (all
`open_adaptable`), their paired `*_COPYRIGHT` / `*_LICENSE` policy entries, and
`SATHEE_BANK` (`scope_only`, syllabus scope only). No invented IDs, no new
source objects.

## Notes

- `the-internet-web-and-email` was trimmed from 11 to 10 blocks (ports table
  merged into the HTTP/HTTPS block).
- Two strings tripped the validator's `data:` URL guard ("Web and data:",
  "Big Data:") — reworded; no meaning change.

## Open items for the human reviewer

1. Confirm the four `intermediate` gradings (office, emerging tech, web/email,
   infosec-attacks) against the existing computer topics.
2. `emerging-technologies` keeps blockchain / cryptocurrency strictly
   descriptive (no advice, no prices) — confirm that framing.
3. `information-security-basics-and-attacks` includes a "what a bank will
   never ask" warning block (OTP, KYC links, remote-access apps) in original
   wording — confirm the claims.
4. Approve status — imported as `published` (blanket approval);
   `study-publish.mjs --unpublish` to hold.
