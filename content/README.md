# Study content

Git-managed authoring source for the knowledge base. Each `*.topic.json` here is
the source of truth for one topic; `scripts/study-import.ts` projects it into
Postgres. The database is the runtime store, but this directory is what gets
reviewed and versioned.

```
content/
  source-registry.json          allowlisted sources + banned domains (spec §5)
  <subject>/<chapter>/<topic>.topic.json
  review-reports/                reviewer output, one file per subject
schemas/
  study-topic.schema.json        the shape of a *.topic.json
  flashcard-set.schema.json      optional standalone flashcard form
```

## Commands

```bash
# 1. Local Postgres (first time / after editing docker/postgres/init.sql)
docker compose up -d db
# put the container's postgres:// URL in .env.local as DATABASE_URL and DIRECT_URL
#   host 127.0.0.1  port 5544  db onelystop  user postgres  password postgres

# 2. Apply migrations
bun run db:migrate

# 3. Validate authored content (exits non-zero on any error)
bun run study:validate                       # whole corpus
node scripts/study-validate.mjs --dir content/english
node scripts/study-validate.mjs --strict     # warnings fail too

# 4. Import into Postgres (idempotent; validates first, skips a file with errors)
bun run study:import
bun scripts/study-import.ts --dir content/quantitative-aptitude
bun scripts/study-import.ts --file content/english/grammar/subject-verb-agreement.topic.json
```

Re-running the importer on an unchanged file is a no-op. Editing a file and
re-importing at the **same** `contentVersion` replaces that version's blocks and
flashcards in place. Bump `contentVersion` to keep the previous version's rows.

## Authoring rules (see docs/study-module-spec.md for the full spec)

- 600–1,400 words, 5–10 blocks, 6–10 flashcards, 3–6 learning objectives.
- Every factual block carries at least one `sourceId` that resolves in
  `source-registry.json` and is not `scope_only`.
- Sources are **only** those in `source-registry.json`. Respect `usageMode`:
  `scope_only` decides coverage only; `reference_only` supports facts that must
  be re-explained in original words; `open_adaptable` needs the exact licence and
  attribution recorded.
- All prose, worked examples, questions, passages and distractors are original.
  Never reproduce a source example with the numbers changed.
- Never claim a question is a previous-year / official question. The validator
  rejects those phrases.
- No raw HTML, scripts, event handlers, `data:` or `javascript:` URLs, or
  embedded images in `markdown`.
- Quantitative `worked_example` blocks must carry `expectedAnswers` with an
  `expression` the validator recomputes.
- Banking and exam-cycle topics carry `lastReviewedAt`, `reviewCadenceDays`, and
  (for cycle pages) `examCycle` + `officialNotificationUrl`.
- Keep `contentStatus` at `draft` until a human reviewer publishes. A content
  author never sets it to `published`.

## Attribution

For every source used: record the exact URL, title, publisher, `usageMode`,
`license` (if any), and `retrievedAt` in the topic's `sources` array. The
reader's "Sources" drawer surfaces these to learners. For `open_adaptable`
(CC BY-SA) material, adapted expression must preserve attribution and ShareAlike;
prefer `adapted: false` and genuinely original wording.
