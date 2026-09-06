import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as schema from "@/db/schema";
import type { ArticleRow } from "@/db/schema";
import type { GeneratedQuestion, RawArticle } from "@/lib/gazette/types";
import { runGenerate } from "./generate";
import { runIngest } from "./ingest";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "..", "migrations");

/* Real tables from the real migration files, in PGlite, so what these tests
   exercise is the orchestration — statuses, counters, deadline, retention —
   and not a hand-rolled imitation of the query builder. */

async function freshDb() {
  const client = new PGlite();
  await client.exec(
    "create role anon nologin; create role authenticated nologin;",
  );
  const files = readdirSync(MIGRATIONS)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();
  for (const f of files) {
    const text = readFileSync(join(MIGRATIONS, f), "utf8");
    if (!/"articles"/.test(text)) continue;
    for (const stmt of text.split("--> statement-breakpoint")) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return { client, db: drizzle(client, { schema }) };
}

const NOW = new Date("2026-09-05T12:00:00+05:30");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

const LONG =
  "The Reserve Bank of India kept the repo rate at 6.5% for a sixth straight meeting, the Monetary Policy Committee said on Friday, citing sticky food inflation and a firm growth outlook. Economists had widely expected the pause. The central bank retained its withdrawal-of-accommodation stance and projected inflation at 4.5% for the year, with growth at 7%. Bond yields were little changed after the decision.";

const MCQ: GeneratedQuestion = {
  relevant: true,
  topic: "Monetary Policy & RBI",
  questionText: "At what level did the RBI hold the repo rate?",
  options: { A: "6.5%", B: "6%", C: "7%", D: "5.5%" },
  answer: "A",
  explanation: "The RBI kept the repo rate at 6.5%.",
};

const raw = (over: Partial<RawArticle> = {}): RawArticle => ({
  source: "newsdata_io",
  title: "RBI keeps repo rate at 6.5%",
  summary: LONG,
  url: `https://example.com/${randomUUID()}`,
  publishedAt: NOW,
  scope: "national",
  ...over,
});

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
  ({ client, db } = await freshDb());
}, 30_000);

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await client.exec("truncate articles, questions, generate_runs");
});

async function seed(over: Partial<typeof schema.articles.$inferInsert> = {}) {
  const [row] = await db
    .insert(schema.articles)
    .values({
      source: "newsdata_io",
      title: "RBI keeps repo rate at 6.5%",
      summary: LONG,
      url: `https://example.com/${randomUUID()}`,
      publishedAt: NOW,
      scope: "national",
      contentHash: randomUUID(),
      status: "new",
      ...over,
    })
    .returning();
  return row;
}

const article = (id: string) =>
  db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.articleId, id))
    .then((r) => r[0]);

const noSleep = async () => {};

describe("runGenerate", () => {
  it("publishes, rejects, expires, and leaves a transient error for the next run", async () => {
    const good = await seed({ title: "good" });
    const rejected = await seed({
      title: "rejected",
      publishedAt: minutesAgo(1),
    });
    const failing = await seed({
      title: "failing",
      publishedAt: minutesAgo(2),
    });
    const stale = await seed({ title: "stale", publishedAt: daysAgo(5) });
    const done = await seed({ title: "done", status: "used" });

    const generate = vi.fn(async (a: ArticleRow) => {
      if (a.title === "good") return MCQ;
      if (a.title === "rejected") return { relevant: false } as const;
      throw new Error("429 RESOURCE_EXHAUSTED retryDelay: 5s");
    });

    const run = await runGenerate(undefined, {
      deps: { db, generate, fetchBody: async () => "" },
      rpm: 600,
      now: () => NOW.getTime(),
      sleep: noSleep,
    });

    expect(run).toMatchObject({
      planned: 3,
      published: 1,
      rejectedIrrelevant: 1,
      errors: 1,
      expired: 1,
      leftover: 0,
      status: "done",
    });
    expect(generate).toHaveBeenCalledTimes(3);

    expect((await article(good.articleId)).status).toBe("used");
    expect(await article(rejected.articleId)).toMatchObject({
      status: "skipped",
      skipReason: "irrelevant:model",
    });
    expect((await article(failing.articleId)).status).toBe("new");
    expect(await article(stale.articleId)).toMatchObject({
      status: "skipped",
      skipReason: "expired",
    });
    expect((await article(done.articleId)).status).toBe("used");

    const questions = await db.select().from(schema.currentAffairsQuestions);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({
      articleId: good.articleId,
      extractedDay: "2026-09-05",
      answer: "A",
      topic: "Monetary Policy & RBI",
    });
  });

  it("stops at the deadline and leaves the rest new", async () => {
    await seed();
    await seed({ publishedAt: minutesAgo(1) });
    const generate = vi.fn(async () => MCQ);

    const run = await runGenerate(undefined, {
      deps: { db, generate, fetchBody: async () => "" },
      rpm: 600,
      now: () => NOW.getTime(),
      sleep: noSleep,
      deadlineMs: 0,
    });

    expect(run).toMatchObject({ planned: 2, published: 0, leftover: 2 });
    expect(generate).not.toHaveBeenCalled();
  });

  it("fetches the page for a thin snippet and grounds on what it finds", async () => {
    const thin = await seed({ summary: "RBI holds rate." });
    const seen: string[] = [];
    const generate = vi.fn(async (_a: ArticleRow, sourceText: string) => {
      seen.push(sourceText);
      return MCQ;
    });

    const run = await runGenerate(undefined, {
      deps: { db, generate, fetchBody: async () => LONG },
      rpm: 600,
      now: () => NOW.getTime(),
      sleep: noSleep,
    });

    expect(run).toMatchObject({ published: 1, bodiesFetched: 1 });
    expect(seen[0]).toContain(LONG);
    expect((await article(thin.articleId)).status).toBe("used");
  });

  it("skips a Hindi snippet before spending a page fetch", async () => {
    await seed({
      title: "रेपो दर",
      summary: "भारतीय रिज़र्व बैंक ने रेपो दर को अपरिवर्तित रखा है।",
    });
    const fetchBody = vi.fn(async () => LONG);
    const generate = vi.fn(async () => MCQ);

    const run = await runGenerate(undefined, {
      deps: { db, generate, fetchBody },
      rpm: 600,
      now: () => NOW.getTime(),
      sleep: noSleep,
    });

    expect(run).toMatchObject({ skippedNonEnglish: 1, published: 0 });
    expect(fetchBody).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("drops lexicon noise before the model sees it", async () => {
    await seed({ title: "Pothole on MG Road swallows scooter", summary: "" });
    const generate = vi.fn(async () => MCQ);

    const run = await runGenerate(undefined, {
      deps: { db, generate, fetchBody: async () => "" },
      rpm: 600,
      now: () => NOW.getTime(),
      sleep: noSleep,
    });

    expect(run).toMatchObject({ skippedIrrelevant: 1 });
    expect(generate).not.toHaveBeenCalled();
  });
});

describe("runIngest", () => {
  it("stores new articles and marks a same-day paraphrase as a duplicate", async () => {
    const paraphrase = raw({
      title: "Reserve Bank of India holds policy rate at 6.5 per cent",
      summary: "No change from the central bank this quarter.",
      publishedAt: minutesAgo(-1),
    });
    const summary = await runIngest(
      {
        db,
        fetchNews: async () => [raw(), paraphrase],
        fetchRss: async () => [
          raw({
            source: "rbi_rss",
            title: "Press release on NBFC norms",
            summary:
              "Revised capital norms for non-banking financial companies take effect next quarter.",
          }),
        ],
      },
      NOW,
    );

    expect(summary).toMatchObject({
      fetched: 3,
      new: 2,
      duplicate: 1,
      conflict: 0,
    });
    const rows = await db.select().from(schema.articles);
    expect(rows.map((r) => r.status).sort()).toEqual([
      "duplicate",
      "new",
      "new",
    ]);
  });

  it("is idempotent across a double-fired cron", async () => {
    const deps = {
      db,
      fetchNews: async () => [raw(), raw({ title: "SEBI fines a broker" })],
      fetchRss: async () => [],
    };
    await runIngest(deps, NOW);
    const second = await runIngest(deps, NOW);

    expect(second).toMatchObject({ new: 0, duplicate: 0, conflict: 2 });
    expect(await db.select().from(schema.articles)).toHaveLength(2);
  });

  it("prunes old articles that never became questions", async () => {
    const old = await seed({ status: "skipped", publishedAt: daysAgo(100) });
    const kept = await seed({ status: "used", publishedAt: daysAgo(100) });
    const recent = await seed({ status: "skipped", publishedAt: daysAgo(10) });

    const summary = await runIngest(
      { db, fetchNews: async () => [], fetchRss: async () => [] },
      NOW,
    );

    expect(summary.pruned).toBe(1);
    expect(await article(old.articleId)).toBeUndefined();
    expect(await article(kept.articleId)).toBeDefined();
    expect(await article(recent.articleId)).toBeDefined();
  });
});
