# Computer Awareness — review report

**Scope:** `content/computer-awareness/` — 8 launch topics.
**Date:** 2026-09-01
**Reviewer:** content-pipeline (author self-review + automated verification). An
independent human subject reviewer must still sign off before any topic leaves
`draft`.

## Verification performed

- `node scripts/study-validate.mjs --dir content/computer-awareness` — **0
  errors, 0 warnings** (after a one-line expansion to bring
  `input-and-output-devices` from 599 to 672 words).
- Schema, unique keys, sorted positions, one usable source per factual block,
  no banned domains, no raw HTML / images / event handlers — all passing.
- `number-systems-and-data-representation` has a `worked_example` whose
  `expectedAnswers` (binary/hex conversions written as decimal arithmetic) are
  recomputed by the validator and match.
- Idempotent import verified: `study:import --dir content/computer-awareness`
  ran clean; a second run reports `unchanged`.

## Per-topic result

| Topic                                        | Chapter               | Blocks | Cards | Words | Class |
| -------------------------------------------- | --------------------- | ------ | ----- | ----- | ----- |
| `computer-fundamentals-and-functional-units` | fundamentals          | 7      | 7     | 705   | PASS  |
| `input-and-output-devices`                   | fundamentals          | 7      | 7     | 672   | PASS  |
| `memory-and-storage`                         | fundamentals          | 7      | 7     | 740   | PASS  |
| `number-systems-and-data-representation`     | fundamentals          | 8      | 7     | 857   | PASS  |
| `operating-systems-and-software`             | software-and-data     | 7      | 7     | 686   | PASS  |
| `dbms-fundamentals`                          | software-and-data     | 7      | 7     | 694   | PASS  |
| `computer-networks`                          | networks-and-security | 7      | 7     | 762   | PASS  |
| `cyber-security-basics`                      | networks-and-security | 8      | 8     | 944   | PASS  |

No topic is PASS_WITH_CHANGES or REJECT from the automated pass.

## Provenance and vendor-neutrality (§15)

- Basic-computing topics cite `WIKIBOOKS_COMPUTING` (`open_adaptable`, CC BY-SA);
  security terminology cites `NIST_GLOSSARY` (`open_adaptable`) with
  `NIST_COPYRIGHT` noted as the licensing policy source.
- The NIST phishing definition and its underlying Special Publications
  (SP 800-12 Rev.1, SP 800-63, etc.) were checked on csrc.nist.gov; the
  explanations here are re-written in original teaching wording, not copied.
- **No Microsoft Learn or vendor product documentation was used.** Content is
  vendor-neutral; where a specific product would be needed it is described
  generically ("a word processor", "the office suite").
- **Obsolete terms are flagged as historical**, per §15: CRT monitors,
  dot-matrix printers, floppy drives, hubs, bus topology, PS/2 / serial /
  parallel / VGA ports, batch operating systems.
- No previous-year or official-question language anywhere.

## Open items for the human reviewer

1. Confirm the difficulty labels (`dbms-fundamentals` and `cyber-security-basics`
   marked `intermediate`; the rest `beginner`).
2. Spot-check the number-system worked example and its `expectedAnswers`.
3. Check the CIA-triad, ACID, and OSI-adjacent framing against the current NIST
   glossary entries.
4. Decide whether `cyber-security-basics` (944 words, 8 cards) should be split
   into two topics before publication.
5. Approve status change from `draft` — no pipeline agent may do this.
