# Gazette migrations

This is the migration history for the Gazette current-affairs PGlite database.
It is deliberately independent from the application's Supabase migration
history in [`src/migrations/`](../src/migrations/).

`src/lib/gazette/db/index.ts` applies these files to `PGLITE_DATA_DIR` (or
`.pgdata` locally). Keep the initial baseline as `0000_*`; it does not share
numbering with the app migrations, whose next file is `src/migrations/0004_*`.
