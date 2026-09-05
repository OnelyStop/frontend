import { sql } from "drizzle-orm";
import {
  char,
  check,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const examBoard = pgEnum("exam_board", [
  "IBPS PO",
  "IBPS Clerk",
  "SBI PO",
  "SBI Clerk",
  "RBI Grade B",
]);

export const examSection = pgEnum("exam_section", [
  "Quantitative Aptitude",
  "Reasoning Ability",
  "English Language",
  "General Awareness",
  "Computer Aptitude",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    displayName: text("display_name"),
    bio: text("bio"),
    country: char("country", { length: 2 }).notNull().default("IN"),
    school: text("school"),
    targetYear: integer("target_year"),
    examBoard: examBoard("exam_board").notNull().default("IBPS PO"),
    defaultSection: examSection("default_section")
      .notNull()
      .default("Quantitative Aptitude"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "profiles_target_year_check",
      sql`${t.targetYear} is null or ${t.targetYear} between 2000 and 2100`,
    ),
    pgPolicy("signed-in users can read their own profile", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.id}`,
    }),
    pgPolicy("signed-in users can update their own profile", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.id}`,
      withCheck: sql`(select auth.uid()) = ${t.id}`,
    }),
  ],
).enableRLS();
