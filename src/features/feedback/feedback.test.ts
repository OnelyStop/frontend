import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { DAILY_LIMIT, submitFeedback } from "./feedback.server";
import { feedbackInput } from "./types";

// Every migration in order — a named subset silently misses the next one added.
const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");

const USER = randomUUID();
const OTHER = randomUUID();
const NOW = new Date("2026-09-17T10:00:00Z");

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
  await client.exec(
    `insert into auth.users (id) values ('${USER}'), ('${OTHER}')`,
  );
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await client.exec("truncate feedback");
});

const note = {
  subject: "Mocks timer",
  message: "The timer kept running while the page was hidden.",
};

describe("submitFeedback", () => {
  it("stores what the user wrote, against the user from the session", async () => {
    await expect(
      submitFeedback(db, USER, { ...note, pagePath: "/mocks" }, NOW),
    ).resolves.toMatchObject({ ok: true });

    const [row] = await db.select().from(schema.feedback);
    expect(row).toMatchObject({ userId: USER, ...note, pagePath: "/mocks" });
  });

  it("caps a user at the daily limit, counted from the database", async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      expect((await submitFeedback(db, USER, note, NOW)).ok).toBe(true);
    }

    await expect(submitFeedback(db, USER, note, NOW)).resolves.toEqual({
      ok: false,
      reason: "daily_limit",
    });
    expect((await submitFeedback(db, OTHER, note, NOW)).ok).toBe(true);
    const tomorrow = new Date(NOW.getTime() + 86_400_000 + 1);
    expect((await submitFeedback(db, USER, note, tomorrow)).ok).toBe(true);
  });
});

describe("feedback table checks", () => {
  // The API validates first; these prove the database refuses the same shapes if anything else writes.
  it("refuses a message shorter than the API allows", async () => {
    await expect(
      client.exec(
        `insert into feedback (user_id, subject, message) values ('${USER}', 'Hello', 'short')`,
      ),
    ).rejects.toThrow(/feedback_message_len_check/);
  });

  it("refuses a message with no subject", async () => {
    await expect(
      client.exec(
        `insert into feedback (user_id, message) values ('${USER}', 'long enough message here')`,
      ),
    ).rejects.toThrow(/null value in column "subject"/);
  });
});

describe("feedbackInput", () => {
  it("takes only a same-site path, never a full or protocol-relative URL", () => {
    const withPath = (pagePath: string) =>
      feedbackInput.safeParse({ ...note, pagePath }).success;
    expect(withPath("/mocks/ibps-po")).toBe(true);
    expect(withPath("https://evil.example/x")).toBe(false);
    expect(withPath("//evil.example/x")).toBe(false);
    expect(withPath("javascript:alert(1)")).toBe(false);
  });
});
