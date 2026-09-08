import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { profiles } from "./profiles";

export const notificationKind = pgEnum("notification_kind", [
  "doubt_reply",
  "marking_ready",
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: notificationKind("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    // Where the notification takes you; nullable so a system notice can be inert.
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // The bell only ever asks for one user's unread, newest first.
    index("notifications_unread_idx")
      .on(t.userId, t.createdAt.desc())
      .where(sql`${t.readAt} is null`),
    index("notifications_user_idx").on(t.userId, t.createdAt.desc()),
    pgPolicy("a user reads only their own notifications", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("a user marks only their own notifications read", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();
