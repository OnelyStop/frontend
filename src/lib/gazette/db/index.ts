import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

type Db = PgliteDatabase<typeof schema>;

// Embedded Postgres stored in a local folder. Reads process.env directly — the
// DB layer must not depend on the NewsData / Gemini keys being set (so
// `db:migrate` works on a fresh checkout). Single writer per process: in dev,
// stop `next dev` before `bun run pipeline`, or drive the pipeline through the
// /internal/* HTTP routes instead.
let cached: Promise<Db> | undefined;
let testOverride: Db | undefined;

async function init(): Promise<Db> {
  const client = new PGlite(process.env.PGLITE_DATA_DIR || ".pgdata");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: join(process.cwd(), "src/migrations") });
  return db;
}

export function getDb(): Promise<Db> {
  if (testOverride) return Promise.resolve(testOverride);
  return (cached ??= init());
}

/** Integration tests point every getDb() caller at a throwaway in-memory PGlite. */
export function __setDbForTests(db: Db | undefined): void {
  testOverride = db;
}

export type { Db };
export { schema };
