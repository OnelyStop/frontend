# English — exam-skills chapter fill (Batch 3b-ii)

**Scope:** 5 new topics in `content/english/exam-skills/`.
**Date:** 2026-09-02
**Reviewer:** content-pipeline (author self-review + automated verification).
Human subject review still required.

Completes the contextual-English cluster SBI now weights heavily, and
introduces the corpus's **first advanced topic** (`para-jumbles`). Applies the
example bar: every topic carries ≥1 worked example + a practice block with a
single defensible answer per item.

## Topics

| Topic                               | Position | Difficulty   | Blocks | Worked ex. | Practice     | Cards | Words |
| ----------------------------------- | -------- | ------------ | ------ | ---------- | ------------ | ----- | ----- |
| `single-and-double-fillers`         | 40       | intermediate | 8      | 1          | ✓ (6 items)  | 7     | ~921  |
| `cloze-test`                        | 50       | intermediate | 9      | 1          | ✓ (5 blanks) | 7     | ~830  |
| `word-usage-and-word-swap`          | 60       | intermediate | 8      | 1          | ✓ (7 items)  | 8     | ~1053 |
| `phrase-replacement-error-spotting` | 70       | intermediate | 8      | 1          | ✓ (7 items)  | 7     | ~1045 |
| `para-jumbles`                      | 80       | **advanced** | 10     | 2          | ✓ (3 sets)   | 9     | 1401  |

exam-skills chapter now has 8 topics (was 3).

## Verification

- `study:validate` (full corpus, after import) → **0 errors** for all 5 files.
  `para-jumbles` carries one warning: word count 1401 is 1 over the 1400 soft
  target — kept, because trimming further strips reasoning from the two
  advanced worked examples.
- Imported idempotently (`study-import --dir content/english/exam-skills`):
  5 versions created, 42 blocks, 38 flashcards.
- Every worked-example and practice item was authored to have **exactly one
  defensible answer** under the stated context (§15), each with a one-line
  reason. `para-jumbles` answer keys were re-derived independently from the
  five sentences during review (opener test → mandatory pair → pronoun /
  connector links → conclusion); all four sets resolve to a unique order:
  WE1 `Q S P T R`, WE2 `R Q T P S`, practice `A C B D E` / `S1 Q P R S` /
  `A C B D E`.
- All sentences, passages and jumbles are original, office/banking register;
  no source sentence, passage or table is reproduced.

## Provenance

`SATHEE_ENGLISH` (`scope_only`) cited only to confirm each is a standard
question type. `WIKIBOOKS_ENGLISH_GRAMMAR` (`open_adaptable`, CC BY-SA) as the
grammar cross-check on every factual block. No new registry entries needed.

## Difficulty note

`para-jumbles` is the first `advanced` topic: 10 blocks, two fully-reasoned
worked examples (the second with two plausible openers resolved by a connector),
a dedicated "why candidates lose marks" block, and a 3-set practice block.
Corpus is now 34 beginner / 16 intermediate / 1 advanced.

## Open items for the human reviewer

1. **`word-usage-and-word-swap` practice item 4** ("counted the customer /
   greeted the notes") — the corrected sentence is unique, but the swap can be
   _named_ two ways (verbs `counted↔greeted` or nouns `customer↔notes`), since
   the sentence is symmetric there. Either rephrase so only the verb swap is
   grammatical (as items 5–7 already are), or accept both namings in the key.
2. **`phrase-replacement-error-spotting`** — 4 of 7 practice items have "No
   replacement required" as the answer. That is a higher share than a real
   set (~1 in 5); consider swapping two for items that need a fix.
3. Confirm the usage calls: `effect` (noun) vs `affect` (verb), `principal`
   vs `principle`, `fewer` vs `less`, `imply` vs `infer`; `discuss` as
   transitive (no "about"); subjunctive `be` after "recommended that";
   inversion after "No sooner".
4. Approve status — imported as `published` (built after the blanket approval);
   `study-publish.mjs --unpublish` to hold.
