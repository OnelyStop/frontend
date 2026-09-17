import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

// Read by the team straight from the database, so there are no policies or grants: nothing in the browser ever reads or writes it. A report about one question goes to question_reports instead.
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // Cascades so closing an account erases what it sent, the same as every other row it owns.
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    pagePath: text("page_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "feedback_subject_len_check",
      sql`char_length(${t.subject}) between 3 and 140`,
    ),
    check(
      "feedback_message_len_check",
      sql`char_length(${t.message}) between 10 and 5000`,
    ),
    check(
      "feedback_page_path_len_check",
      sql`${t.pagePath} is null or char_length(${t.pagePath}) <= 300`,
    ),
    index("feedback_created_idx").on(t.createdAt.desc()),
    index("feedback_user_created_idx").on(t.userId, t.createdAt.desc()),
  ],
).enableRLS();
