import { db } from "@/db";
import * as schema from "./schema";

type Db = typeof db;

// Gazette shares the application's Supabase/Postgres database. Its schema is
// created by src/migrations/0004_gazette.sql with the rest of the app history.
export function getDb(): Promise<Db> {
  return Promise.resolve(db);
}

export type { Db };
export { schema };
