import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

// The route handler enforces status='published'; this only blocks the anon key.
export const contentReadable = (name: string) =>
  pgPolicy(name, { for: "select", to: authenticatedRole, using: sql`true` });
