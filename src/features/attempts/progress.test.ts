import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { getProgress, getTopicMap } from "./progress.server";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");

async function freshDb() {
  const client = new PGlite();
  await client.exec(`
    create role anon nologin;
    create role authenticated nologin;
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

// Fixed instant, well inside an IST day, so a test never depends on when it runs.
const NOW = new Date("2026-03-15T12:00:00+05:30");
const PAPER = "ibps-po-prelims-2025-s1";

describe("progress", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let userId: string;

  beforeAll(async () => {
    ({ client, db } = await freshDb());
    userId = randomUUID();
    await client.query("insert into auth.users (id, email) values ($1, $2)", [
      userId,
      "sitter@example.com",
    ]);
    await db
      .insert(schema.papers)
      .values({ paperId: PAPER, examKey: "ibps|po|prelims|2025|1" });
  }, 60_000);

  afterAll(() => client.close());

  let seq = 0;

  async function question(section: string, topic: string, answer: string) {
    const n = seq++;
    const qId = `q-${n}`;
    await db.insert(schema.bankQuestions).values({
      qId,
      paperId: PAPER,
      qNum: n,
      section,
      topic,
      stem: "stem",
      options: { A: "a", B: "b", C: "c", D: "d" },
      answer,
      contentHash: `hash-${n}`,
    });
    return qId;
  }

  async function sitting(
    startedAt: Date,
    answers: { qId: string; chosen: string | null; timeMs: number | null }[],
  ) {
    const [attempt] = await db
      .insert(schema.attempts)
      .values({
        userId,
        mode: "paper",
        startedAt,
        submittedAt: startedAt,
      })
      .returning({ id: schema.attempts.id });
    for (const a of answers) {
      await db.insert(schema.attemptAnswers).values({
        attemptId: attempt!.id,
        qId: a.qId,
        chosen: a.chosen,
        timeMs: a.timeMs,
      });
    }
  }

  it("paces a section over its timed answers, not over every attempt", async () => {
    const q1 = await question("Quantitative", "Arithmetic", "A");
    const q2 = await question("Quantitative", "Arithmetic", "A");
    await sitting(new Date("2026-03-15T09:00:00+05:30"), [
      { qId: q1, chosen: "A", timeMs: 60_000 },
      // The client posts null when it could not time an answer.
      { qId: q2, chosen: "B", timeMs: null },
    ]);

    const p = await getProgress(db, userId, NOW);
    const quant = p.sections.find((s) => s.section === "Quantitative");
    // 60s over one timed answer. Dividing by both attempts gives 30s, which the view paints green.
    expect(quant?.avgSec).toBe(60);
    expect(quant?.attempted).toBe(2);
  });

  it("reports no pace rather than a fast one when nothing was timed", async () => {
    const q = await question("English", "Vocabulary", "A");
    await sitting(new Date("2026-03-15T09:00:00+05:30"), [
      { qId: q, chosen: "A", timeMs: null },
    ]);

    const p = await getProgress(db, userId, NOW);
    expect(p.sections.find((s) => s.section === "English")?.avgSec).toBeNull();
  });

  it("stamps each week bar with the IST day it counts, oldest first", async () => {
    const p = await getProgress(db, userId, NOW);
    expect(p.week.map((d) => d.date)).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
  });

  it("buckets a late-evening IST sitting under its own calendar day", async () => {
    const q = await question("Reasoning", "Puzzles", "A");
    // 23:30 IST on the 14th is 18:00 UTC — an elapsed-hours bucket calls this today.
    await sitting(new Date("2026-03-14T23:30:00+05:30"), [
      { qId: q, chosen: "A", timeMs: 30_000 },
    ]);

    const p = await getProgress(db, userId, NOW);
    const byDate = new Map(p.week.map((d) => [d.date, d.count]));
    expect(byDate.get("2026-03-14")).toBe(1);
  });

  it("gives an empty week the seven dated bars the view renders", async () => {
    const stranger = randomUUID();
    await client.query("insert into auth.users (id, email) values ($1, $2)", [
      stranger,
      "nobody@example.com",
    ]);
    const p = await getProgress(db, stranger, NOW);
    expect(p.attempted).toBe(0);
    expect(p.week).toHaveLength(7);
    expect(p.week.every((d) => d.count === 0)).toBe(true);
  });

  it("drops a topic with too few attempts to read a verdict off", async () => {
    const topics = await getTopicMap(db, userId, NOW);
    // Arithmetic has 2 attempts, Vocabulary 1, Puzzles 1 — none reach the floor.
    expect(topics).toEqual([]);

    const qs = await Promise.all([
      question("Quantitative", "Simplification", "A"),
      question("Quantitative", "Simplification", "A"),
      question("Quantitative", "Simplification", "A"),
    ]);
    await sitting(new Date("2026-03-13T10:00:00+05:30"), [
      { qId: qs[0]!, chosen: "A", timeMs: 40_000 },
      { qId: qs[1]!, chosen: "B", timeMs: 50_000 },
      { qId: qs[2]!, chosen: "A", timeMs: 60_000 },
    ]);

    const after = await getTopicMap(db, userId, NOW);
    expect(after.map((t) => t.topic)).toEqual(["Simplification"]);
    expect(after[0]).toMatchObject({ attempted: 3, correct: 2, avgSec: 50 });
    expect(after[0]!.accuracy).toBeCloseTo(66.67, 1);
  });

  it("counts nobody else's sittings", async () => {
    const other = randomUUID();
    await client.query("insert into auth.users (id, email) values ($1, $2)", [
      other,
      "other@example.com",
    ]);
    const p = await getProgress(db, other, NOW);
    expect(p.attempted).toBe(0);
    expect(await getTopicMap(db, other, NOW)).toEqual([]);
  });
});
