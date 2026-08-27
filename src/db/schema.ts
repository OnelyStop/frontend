import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

export const appRole = pgEnum("app_role", ["admin", "editor"]);

export const appPermission = pgEnum("app_permission", [
  "questions.create",
  "questions.update",
  "questions.delete",
  "papers.import",
  "users.read",
]);

// Roles are stored here rather than in user_metadata, which the user can write
// to and could use to make themselves an admin.
export const userRoles = pgTable(
  "user_roles",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    role: appRole("role").notNull(),
  },
  (t) => [
    unique("user_roles_user_id_role_key").on(t.userId, t.role),

    // Paired with a SELECT grant in the migration — Postgres checks grants
    // before RLS, so the policy is inert without it.
    pgPolicy("signed-in users can read their own role", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),

    // No insert/update/delete policy on purpose: granting a role is a
    // service-role operation, so no signed-in user can escalate their own.
  ],
).enableRLS();

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    role: appRole("role").notNull(),
    permission: appPermission("permission").notNull(),
  },
  (t) => [
    unique("role_permissions_role_permission_key").on(t.role, t.permission),

    pgPolicy("signed-in users can read permissions", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Billing
//
// Access is decided by one column: entitlements.access_until. Everything else
// here -- Razorpay's subscription states, the payments, the webhook events --
// is the audit trail that explains how that timestamp got its value. A feature
// asks "is access_until in the future", never "what is Razorpay saying".
// ---------------------------------------------------------------------------

export const billingInterval = pgEnum("billing_interval", ["monthly", "yearly"]);

// One plan object exists in Razorpay per currency, because Razorpay fixes the
// currency on the plan itself -- so .in and .com are different plan ids for the
// same product.
export const currencyCode = pgEnum("currency_code", ["INR", "USD"]);

// Razorpay's own subscription states, mirrored exactly. Inventing our own
// vocabulary here would mean translating on every webhook, and a mistranslation
// is invisible until a renewal silently stops granting access.
export const subscriptionStatus = pgEnum("subscription_status", [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
]);

// What the user is paying for. Kept apart from Razorpay's plan id so a price
// change, a promo, or a second provider does not need a new product.
export const planKey = pgEnum("plan_key", ["pro", "school"]);

// The price source of truth. The client never sends an amount or a currency:
// currency comes from the request host (.in -> INR, .com -> USD) and the amount
// is read from here, or a caller could buy Pro for one paisa.
export const paymentPlans = pgTable(
  "payment_plans",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    plan: planKey("plan").notNull(),
    interval: billingInterval("interval").notNull(),
    currency: currencyCode("currency").notNull(),
    // Razorpay's plan id, created once per (plan, interval, currency).
    razorpayPlanId: text("razorpay_plan_id").notNull(),
    // Minor units -- paise, cents. Never a float: 7.99 * 100 is 798.9999… in
    // float64, and a rounding error in an amount is a real charge.
    amountMinor: integer("amount_minor").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Partial, not a plain unique: Razorpay plan objects are immutable, so
    // changing a price means creating a new one and retiring the old. Existing
    // subscribers keep billing against the plan they signed up to, which is the
    // behaviour we want -- so a slot may hold many retired rows and exactly one
    // live one.
    uniqueIndex("payment_plans_active_slot_key")
      .on(t.plan, t.interval, t.currency)
      .where(sql`${t.active}`),
    unique("payment_plans_razorpay_plan_id_key").on(t.razorpayPlanId),

    // Prices are public -- the marketing page renders them to signed-out
    // visitors. Readable by anyone, writable by nobody but the service role.
    pgPolicy("anyone can read plan prices", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    razorpaySubscriptionId: text("razorpay_subscription_id").notNull(),
    planId: bigint("plan_id", { mode: "number" }).notNull(),
    status: subscriptionStatus("status").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("subscriptions_razorpay_subscription_id_key").on(t.razorpaySubscriptionId),
    index("subscriptions_user_id_idx").on(t.userId),

    pgPolicy("signed-in users can read their own subscriptions", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    // No write policy: only the webhook, running as the service role, may move
    // a subscription's state.
  ],
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    subscriptionId: bigint("subscription_id", { mode: "number" }),
    razorpayPaymentId: text("razorpay_payment_id").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: currencyCode("currency").notNull(),
    status: text("status").notNull(),
    method: text("method"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Razorpay may deliver the same payment on more than one event. This is
    // what makes recording it twice impossible rather than merely unlikely.
    unique("payments_razorpay_payment_id_key").on(t.razorpayPaymentId),
    index("payments_user_id_idx").on(t.userId),
    index("payments_subscription_id_idx").on(t.subscriptionId),

    pgPolicy("signed-in users can read their own payments", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

// Every webhook Razorpay delivers, recorded before it is acted on. The unique
// event id is the idempotency key: Razorpay says plainly that the same event
// can arrive more than once, so a redelivery must conflict here and roll the
// whole transaction back rather than grant a second month.
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("payment_events_event_id_key").on(t.eventId),
    index("payment_events_event_type_idx").on(t.eventType),

    // Deliberately no read policy: the payload is the raw provider event and
    // has no reason to reach a browser.
  ],
).enableRLS();

// What the app actually reads. Separate from `subscriptions` on purpose --
// access has to survive a provider change, a support grant, or a refund
// argument without a feature ever learning what Razorpay is.
export const entitlements = pgTable(
  "entitlements",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    plan: planKey("plan").notNull(),
    // The single access check: access_until > now(). One comparison, in one
    // place, so no feature can invent its own idea of "still paid".
    accessUntil: timestamp("access_until", { withTimezone: true }).notNull(),
    // Informational -- why access_until says what it does. Never the check.
    status: subscriptionStatus("status").notNull(),
    subscriptionId: bigint("subscription_id", { mode: "number" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One live entitlement per user. Renewals move access_until forward on
    // this row rather than adding another, so "which one wins" never arises.
    unique("entitlements_user_id_key").on(t.userId),

    pgPolicy("signed-in users can read their own entitlement", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// The user
//
// Identity and intent: who someone is, and which exam they are sitting.
// Deliberately not what they have DONE -- attempts, mastery, streak and points
// are the product's core loop and get their own model.
//
// Both markets share these columns exactly. Nothing here branches on country:
// .in and .com differ in chrome, prices and seed data, never in shape.
// ---------------------------------------------------------------------------

// Supabase's documented shape: the primary key IS the auth.users id. The
// ON DELETE CASCADE lives in the migration because drizzle cannot model a
// reference into the auth schema.
//
// Their example also grants anon SELECT here. We don't -- their profiles hold
// a public username, ours hold a bio, an institution and an exam target, and
// no signed-out page needs any of it.
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),

    // One field, not first/last: Indian names don't reliably split in two.
    // Seeded at signup from raw_user_meta_data, which the user can write --
    // fine for a name, and the reason nothing here is ever read to authorize.
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),

    // ISO-3166, seeded from the signup host. Content and display only: the
    // price currency is derived from the request host server-side, so editing
    // this cannot buy the INR plan from .com.
    countryCode: char("country_code", { length: 2 }).notNull().default("IN"),

    // 'en' | 'hi' -- every TCS iON paper ships both, so this is a real toggle
    // rather than interface chrome.
    locale: text("locale").notNull().default("en"),

    // The one that gets forgotten. A streak and a daily free-practice limit
    // both need a day boundary, and that boundary is per-user: without this a
    // Kolkata student's day rolls over at 05:30. The client overwrites it with
    // the browser's IANA zone on first load; the default is the launch market.
    // Not constrained to pg_timezone_names -- a CHECK can't subquery -- so it
    // is validated in the app before write.
    timezone: text("timezone").notNull().default("Asia/Kolkata"),

    // School, college or coaching centre.
    institution: text("institution"),
    bio: text("bio"),

    // Nullable on purpose: separates a brand-new account from one that reached
    // onboarding and skipped it. A boolean cannot tell those apart.
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),

    // The five UserSettings booleans. Here rather than in their own table
    // because it is one row per user either way, and every extra table is
    // another policy and another grant that can be forgotten -- see the grant
    // comment in 0000_rbac.sql for what that failure looks like.
    emailDigest: boolean("email_digest").notNull().default(true),
    weeklyReport: boolean("weekly_report").notNull().default(true),
    practiceReminders: boolean("practice_reminders").notNull().default(true),
    soundEffects: boolean("sound_effects").notNull().default(false),
    reduceMotion: boolean("reduce_motion").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("signed-in users can read their own profile", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.id}`,
    }),

    // withCheck as well as using, or a user could rewrite the id and hand the
    // row to someone else.
    pgPolicy("signed-in users can update their own profile", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.id}`,
      withCheck: sql`(select auth.uid()) = ${t.id}`,
    }),

    // No insert or delete policy: the row is created by the signup trigger and
    // removed by the cascade from auth.users. A user with no profile row is a
    // user the app cannot render, so neither end of that lifecycle is theirs.
  ],
).enableRLS();

// The exam catalogue, and the join key into the question bank.
//
// (bank, role) are the question bank's own strings, spelled identically --
// 'IBPS' / 'PO'. That is the entire point of this table: a target written in
// any other vocabulary joins to none of the questions we own.
//
// Note this `role` is the exam's, not app_role. The two tables never join.
//
// Prelims/Mains is deliberately absent. Someone preparing for IBPS PO prepares
// for both, so it is a stage you filter practice by, not part of who they are.
//
// A table rather than an enum so adding SSC or Railways is an INSERT, not a
// migration plus a type change plus a deploy.
export const exams = pgTable(
  "exams",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    slug: text("slug").notNull(),
    bank: text("bank").notNull(),
    role: text("role").notNull(),
    displayName: text("display_name").notNull(),
    countryCode: char("country_code", { length: 2 }).notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique("exams_slug_key").on(t.slug),
    unique("exams_bank_role_key").on(t.bank, t.role),

    // Public like plan prices are: the marketing page lists what we cover, and
    // onboarding needs it before a profile exists.
    pgPolicy("anyone can read the exam catalogue", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

// What a user is preparing for. A table, not columns on the profile, because
// one row cannot express the real case: a banking aspirant sits IBPS PO, SBI PO
// and RRB in the same cycle.
export const userExamTargets = pgTable(
  "user_exam_targets",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    examId: bigint("exam_id", { mode: "number" }).notNull(),

    // The attempt cycle. Always known -- it is chosen at onboarding.
    targetYear: integer("target_year").notNull(),

    // Nullable, and that is the honest model: IBPS publishes its calendar late,
    // so the date is usually unknown when the target is set. The countdown
    // renders only once it isn't. AppContext currently does
    // `new Date(Number(examYear), 4, 11)` -- hardcoding 11 May as every
    // student's exam date, which is already wrong for an August Prelims.
    targetDate: date("target_date"),

    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("user_exam_targets_user_id_exam_id_key").on(t.userId, t.examId),
    index("user_exam_targets_user_id_idx").on(t.userId),

    // Partial: many targets per user, at most one flagged primary. Enforced
    // here rather than in the route, so two concurrent requests cannot both
    // win and leave the dashboard with no defined default.
    uniqueIndex("user_exam_targets_one_primary_key")
      .on(t.userId)
      .where(sql`${t.isPrimary}`),

    pgPolicy("signed-in users can read their own targets", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can add their own targets", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can update their own targets", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can remove their own targets", {
      for: "delete",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();
