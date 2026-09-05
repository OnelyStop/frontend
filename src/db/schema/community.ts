import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { examSection, profiles } from "./profiles";

export const doubts = pgTable(
  "doubts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    section: examSection("section").notNull(),
    topic: text("topic").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // Denormalised so the "most stuck" ordering is an index scan rather than a
    // count over doubt_stuck on every page of the feed.
    stuckCount: integer("stuck_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "doubts_title_len_check",
      sql`char_length(${t.title}) between 10 and 160`,
    ),
    check(
      "doubts_body_len_check",
      sql`char_length(${t.body}) between 20 and 4000`,
    ),
    // Both orderings tie-break on id so keyset pagination cannot skip or repeat
    // a row when two doubts share a count or a timestamp.
    index("doubts_stuck_idx").on(t.section, t.stuckCount.desc(), t.id.desc()),
    index("doubts_created_idx").on(t.section, t.createdAt.desc(), t.id.desc()),
    index("doubts_author_idx").on(t.authorId, t.createdAt.desc()),
    pgPolicy("signed-in users can read every doubt", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("signed-in users can post their own doubts", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.authorId}`,
    }),
  ],
).enableRLS();

export const doubtStuck = pgTable(
  "doubt_stuck",
  {
    doubtId: uuid("doubt_id")
      .notNull()
      .references(() => doubts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // The composite key is what makes "stuck" idempotent — a double click
    // conflicts instead of counting twice.
    primaryKey({ columns: [t.doubtId, t.userId] }),
    index("doubt_stuck_user_idx").on(t.userId),
    pgPolicy("signed-in users can read stuck marks", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("signed-in users can mark themselves stuck", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can clear their own stuck mark", {
      for: "delete",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();
