import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const int = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const client = postgres(process.env.DATABASE_URL!, {
  // Supabase's transaction pooler cannot hold prepared statements.
  prepare: false,
  // Fluid reuses instances, so postgres.js's default 10 becomes 10 per warm instance.
  max: int("DB_POOL_MAX", 3),
  // The default is null — an idle connection is held until the instance dies.
  idle_timeout: int("DB_IDLE_TIMEOUT_S", 20),
  max_lifetime: int("DB_MAX_LIFETIME_S", 60 * 30),
  connect_timeout: int("DB_CONNECT_TIMEOUT_S", 10),
  // Without this a scan pins a pooled connection for the whole function duration.
  connection: { statement_timeout: int("DB_STATEMENT_TIMEOUT_MS", 15_000) },
});

export const db = drizzle(client, { schema });
export { schema };

// What a data layer accepts: the app client, a transaction, or PGlite in tests.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
