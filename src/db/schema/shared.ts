import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

// Publication (status = 'published') is enforced by the route handler. This
// only keeps the anon key from reading the table at all.
export const contentReadable = (name: string) =>
  pgPolicy(name, { for: "select", to: authenticatedRole, using: sql`true` });
