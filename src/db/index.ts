import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// prepare:false: Supabase's transaction pooler cannot hold prepared statements.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };

// What a data layer accepts: the app client, a transaction, or PGlite in tests.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
