import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  pgPolicy,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

/**
 * One row per marked descriptive answer. A marking costs real money and the
 * learner's monthly allowance is spent on it, so it is kept rather than
 * recomputed — and the draft with it, since feedback quoting a script the
 * learner can no longer see is unusable.
 */
export const descriptiveMarkings = pgTable(
  "descriptive_markings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    taskId: text("task_id").notNull(),
    answer: text("answer").notNull(),
    words: integer("words").notNull(),
    total: numeric("total", { precision: 5, scale: 2 }).notNull(),
    outOf: numeric("out_of", { precision: 5, scale: 2 }).notNull(),
    marking: jsonb("marking").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("descriptive_markings_user_idx").on(t.userId, t.createdAt),

    pgPolicy("signed-in users can read their own markings", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();
