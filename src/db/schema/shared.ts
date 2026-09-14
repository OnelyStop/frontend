import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const contentReadable = (name: string) =>
  pgPolicy(name, { for: "select", to: authenticatedRole, using: sql`true` });
