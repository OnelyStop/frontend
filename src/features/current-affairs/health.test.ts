import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { pipelineHealth } from "./health.server";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");
const NOW = new Date("2026-09-13T03:00:00Z");

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
});
afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  await client.exec("truncate articles, questions, generate_runs cascade");
});

const article = (createdAt: string) =>
  client.query(
    `insert into articles (source, title, url, published_at, scope, content_hash, created_at)
     values ('pib_rss', 't', 'https://example.com/${createdAt}', $1, 'national', '${createdAt}', $1)`,
    [createdAt],
  );

const question = (createdAt: string) =>
  client.query(
    `insert into questions (extracted_day, question_text, options, answer, explanation, created_at)
     values ('2026-09-12', 'q', '{"A":"a","B":"b","C":"c","D":"d"}'::jsonb, 'A', 'e', $1)`,
    [createdAt],
  );

describe("pipelineHealth", () => {
  it("is healthy when both stages ran last night", async () => {
    await article("2026-09-12T12:40:00Z");
    await question("2026-09-12T13:40:00Z");
    const health = await pipelineHealth(db, NOW);
    expect(health.ok).toBe(true);
    expect(health.stages.map((s) => s.stale)).toEqual([false, false]);
  });

  // The failure this exists for: nothing throws, so nothing else would notice.
  it("catches a scheduler that stopped firing a day ago", async () => {
    await article("2026-09-11T12:40:00Z");
    await question("2026-09-11T13:40:00Z");
    const health = await pipelineHealth(db, NOW);
    expect(health.ok).toBe(false);
    expect(health.stages.filter((s) => s.stale).map((s) => s.stage)).toEqual([
      "ingest",
      "generate",
    ]);
  });

  it("names only the stage that stalled when ingest still runs", async () => {
    await article("2026-09-12T12:40:00Z");
    await question("2026-09-10T13:40:00Z");
    const health = await pipelineHealth(db, NOW);
    expect(health.ok).toBe(false);
    expect(health.stages.filter((s) => s.stale).map((s) => s.stage)).toEqual([
      "generate",
    ]);
  });

  it("treats a table that has never been written as stale, not as fresh", async () => {
    const health = await pipelineHealth(db, NOW);
    expect(health.ok).toBe(false);
    expect(health.stages.every((s) => s.stale && s.lastAt === null)).toBe(true);
  });

  it("is unhealthy when the last generate run recorded a failure", async () => {
    await article("2026-09-12T12:40:00Z");
    await question("2026-09-12T13:40:00Z");
    await client.exec(
      "insert into generate_runs (day, status, errors) values ('2026-09-12', 'failed', 3)",
    );
    const health = await pipelineHealth(db, NOW);
    expect(health.ok).toBe(false);
    expect(health.lastRun).toMatchObject({ status: "failed", errors: 3 });
  });
});
