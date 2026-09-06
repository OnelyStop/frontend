import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { PLAN_LIMITS } from "./limits";
import { aiCallsThisMonth, checkQuota, recordAiCall } from "./usage.server";

// Every migration in order — a named subset silently misses the next one added.
const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");

const USER = randomUUID();

// 11:30 IST on 15 September: mid-day and mid-month, so neither window is on a boundary.
const NOW = new Date("2026-09-15T06:00:00Z");

/* The real migrations in PGlite, with the Supabase auth surface they reference
   stubbed. What is under test is the enforcement: which attempts a cap counts,
   which window it counts them in, and what a paid plan lifts. */
async function freshDb() {
  const client = new PGlite();
  await client.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text unique,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as 'select null::uuid';
  `);
  const files = readdirSync(MIGRATIONS)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();
  for (const f of files) {
    const text = readFileSync(join(MIGRATIONS, f), "utf8");
    for (const stmt of text.split("--> statement-breakpoint")) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return { client, db: drizzle(client, { schema }) };
}

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
  ({ client, db } = await freshDb());
  await client.exec(`insert into auth.users (id) values ('${USER}')`);
}, 30_000);

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await client.exec(
    "truncate attempts, ai_usage, entitlements restart identity cascade",
  );
});

type Mode = (typeof schema.attempts.$inferInsert)["mode"];

const started = (mode: Mode, ...at: string[]) =>
  db
    .insert(schema.attempts)
    .values(
      at.map((iso) => ({ userId: USER, mode, startedAt: new Date(iso) })),
    );

const startedMany = (mode: Mode, n: number, at: string) =>
  started(mode, ...Array.from({ length: n }, () => at));

const grant = (plan: "pro" | "pro_plus", accessUntil: string) =>
  db.insert(schema.entitlements).values({
    userId: USER,
    plan,
    accessUntil: new Date(accessUntil),
    status: "active",
  });

const quota = (what: "mocksPerMonth" | "drillsPerDay" | "askOnelyPerMonth") =>
  checkQuota(db, USER, what, NOW);

const aiRows = () =>
  client
    .query<{ n: number }>("select count(*)::int as n from ai_usage")
    .then((r) => r.rows[0].n);

describe("mocks are capped per month", () => {
  it("allows a free user's second mock", async () => {
    await started("paper", "2026-09-05T04:00:00Z");
    expect(await quota("mocksPerMonth")).toMatchObject({ ok: true });
  });

  it("refuses the third, naming what was used", async () => {
    await started("paper", "2026-09-05T04:00:00Z", "2026-09-10T04:00:00Z");
    expect(await quota("mocksPerMonth")).toEqual({
      ok: false,
      used: 2,
      limit: 2,
    });
  });

  it("does not count drills against the mock cap", async () => {
    await startedMany("bank", 3, "2026-09-05T04:00:00Z");
    await startedMany("mix", 3, "2026-09-10T04:00:00Z");
    expect(await quota("mocksPerMonth")).toMatchObject({ ok: true });
  });

  // 18:00Z on the last of August is 23:30 IST in August; an hour later is 00:30 IST in September.
  it("counts the IST month, not the UTC one", async () => {
    await started(
      "paper",
      "2026-08-31T18:00:00Z",
      "2026-08-31T19:00:00Z",
      "2026-09-10T04:00:00Z",
    );
    expect(await quota("mocksPerMonth")).toEqual({
      ok: false,
      used: 2,
      limit: 2,
    });
  });
});

describe("drills are capped per day", () => {
  it("refuses the fourth drill of a free user's day", async () => {
    await startedMany("bank", 3, "2026-09-15T01:00:00Z");
    expect(await quota("drillsPerDay")).toEqual({
      ok: false,
      used: 3,
      limit: 3,
    });
  });

  it("does not count mocks against the drill cap", async () => {
    await startedMany("paper", 3, "2026-09-15T01:00:00Z");
    expect(await quota("drillsPerDay")).toMatchObject({ ok: true });
  });

  it("forgets yesterday's drills", async () => {
    await startedMany("bank", 3, "2026-09-14T10:00:00Z");
    expect(await quota("drillsPerDay")).toMatchObject({ ok: true });
  });

  // 18:00Z is 23:30 IST yesterday; an hour later is 00:30 IST today.
  it("resets at IST midnight, not UTC midnight", async () => {
    await started("bank", "2026-09-14T18:00:00Z", "2026-09-14T19:00:00Z");
    expect(await quota("drillsPerDay")).toMatchObject({ ok: true });

    await startedMany("mix", 2, "2026-09-15T02:00:00Z");
    expect(await quota("drillsPerDay")).toEqual({
      ok: false,
      used: 3,
      limit: 3,
    });
  });
});

describe("a paid plan lifts the cap", () => {
  it("leaves a pro subscriber uncapped on mocks", async () => {
    expect(PLAN_LIMITS.pro.mocksPerMonth).toBeNull();
    await grant("pro", "2026-10-05T00:00:00Z");
    await startedMany("paper", 50, "2026-09-10T04:00:00Z");
    expect(await quota("mocksPerMonth")).toMatchObject({ ok: true });
  });

  it("falls back to the free cap once access has lapsed", async () => {
    await grant("pro", "2026-09-01T00:00:00Z");
    await started("paper", "2026-09-05T04:00:00Z", "2026-09-10T04:00:00Z");
    expect(await quota("mocksPerMonth")).toEqual({
      ok: false,
      used: 2,
      limit: 2,
    });
  });

  it("raises the Ask Onely cap rather than removing it", async () => {
    await grant("pro", "2026-10-05T00:00:00Z");
    await recordAiCall(db, USER, "ask_onely", NOW);
    expect(await quota("askOnelyPerMonth")).toMatchObject({ ok: true });
    expect(PLAN_LIMITS.pro.askOnelyPerMonth).toBe(250);
  });
});

describe("recordAiCall", () => {
  it("accumulates in one row per IST day and sums across the month", async () => {
    await recordAiCall(db, USER, "ask_onely", NOW);
    await recordAiCall(db, USER, "ask_onely", NOW);
    await recordAiCall(db, USER, "ask_onely", NOW);
    await recordAiCall(db, USER, "ask_onely", new Date("2026-09-03T06:00:00Z"));

    expect(await aiCallsThisMonth(db, USER, "ask_onely", NOW)).toBe(4);
    expect(await aiRows()).toBe(2);
  });

  it("keeps each feature's allowance to itself", async () => {
    await recordAiCall(db, USER, "descriptive_marking", NOW);
    await recordAiCall(db, USER, "ask_onely", NOW);
    expect(await aiCallsThisMonth(db, USER, "ask_onely", NOW)).toBe(1);
    expect(await aiCallsThisMonth(db, USER, "descriptive_marking", NOW)).toBe(
      1,
    );
  });

  it("leaves last month's calls out of this month's total", async () => {
    await recordAiCall(db, USER, "ask_onely", new Date("2026-08-20T06:00:00Z"));
    await recordAiCall(db, USER, "ask_onely", NOW);
    expect(await aiCallsThisMonth(db, USER, "ask_onely", NOW)).toBe(1);
  });
});

describe("Ask Onely is capped per plan", () => {
  it("gives a free user thirty a month and refuses the thirty-first", async () => {
    for (let i = 0; i < 29; i++) await recordAiCall(db, USER, "ask_onely", NOW);
    expect(await quota("askOnelyPerMonth")).toMatchObject({ ok: true });

    await recordAiCall(db, USER, "ask_onely", NOW);
    expect(await quota("askOnelyPerMonth")).toEqual({
      ok: false,
      used: 30,
      limit: 30,
    });
  });
});
