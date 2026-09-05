import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "@/db";
import {
  articles,
  currentAffairsQuestions,
  generateRuns,
  type GenerateRunRow,
  type RunCounter,
} from "@/db/schema";
import { activeProfile } from "@/lib/gazette/config/profile";
import { istDayKey } from "@/lib/gazette/day";
import { generateQuestion } from "@/lib/gazette/generate/generateQuestion";
import { isGrounded } from "@/lib/gazette/grounding/check";
import { log } from "@/lib/gazette/log";
import {
  createPacer,
  retryDelayFromMessage,
} from "@/lib/gazette/pipeline/pace";
import { classifyRelevance } from "@/lib/gazette/relevance/prefilter";
import {
  fetchArticleBody,
  isMostlyEnglish,
} from "@/lib/gazette/sources/extract";

const CONCURRENCY = 2;

// RSS snippets are often headline-only. Below this the article page is fetched;
// still too thin after that and it is skipped rather than spend an LLM call.
const THIN_SNIPPET_CHARS = 320;
const MIN_SOURCE_CHARS = 160;
const MAX_SOURCE_CHARS = 6000;

export type GenerateDeps = {
  db: Db;
  generate: typeof generateQuestion;
  fetchBody: typeof fetchArticleBody;
};

const defaultDeps: GenerateDeps = {
  db: defaultDb,
  generate: generateQuestion,
  fetchBody: fetchArticleBody,
};

// `error` is transient: the article stays `new` so the next run picks it up.
// Every other kind is terminal and the status is already written.
export type ArticleOutcome =
  | { kind: "published" }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; message: string }
  | { kind: "noop" }; // wasn't `new` — already processed

export type RunOptions = {
  deps?: Partial<GenerateDeps>;
  // Stop starting articles after this long; the rest stay `new` for next run.
  deadlineMs?: number;
  rpm?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export type GenerateResult = GenerateRunRow & {
  leftover: number;
  expired: number;
};

// IST day string -> [startUtc, endUtc) covering that day.
function istDayBounds(day: string): [Date, Date] {
  const start = new Date(`${day}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 86_400_000);
  return [start, end];
}

async function incrRun(
  db: Db,
  runId: string,
  col: RunCounter,
  n = 1,
): Promise<void> {
  await db
    .update(generateRuns)
    .set({ [col]: sql`${generateRuns[col]} + ${n}` })
    .where(eq(generateRuns.runId, runId));
}

// Each run takes the newest articles; anything older than the dedup window
// was passed over for good and would otherwise sit as `new` forever.
async function expireStale(db: Db, now: Date): Promise<number> {
  const cutoff = new Date(
    now.getTime() - activeProfile.recentWindowDays * 86_400_000,
  );
  const rows = await db
    .update(articles)
    .set({ status: "skipped", skipReason: "expired" })
    .where(and(eq(articles.status, "new"), lt(articles.publishedAt, cutoff)))
    .returning({ id: articles.articleId });
  return rows.length;
}

function selectNewArticles(db: Db, day?: string) {
  const where = day
    ? and(
        eq(articles.status, "new"),
        gte(articles.publishedAt, istDayBounds(day)[0]),
        lt(articles.publishedAt, istDayBounds(day)[1]),
      )
    : eq(articles.status, "new");
  return db
    .select()
    .from(articles)
    .where(where)
    .orderBy(desc(articles.publishedAt))
    .limit(activeProfile.maxQuestionsPerGenerate);
}

// Re-reads the article first so a retry after the DB write is a no-op. `deps`
// is injectable so tests can keep the LLM and outbound HTTP out of the suite.
export async function processArticle(
  articleId: string,
  opts: {
    runId?: string;
    deps?: Partial<GenerateDeps>;
    pace?: () => Promise<void>;
  } = {},
): Promise<ArticleOutcome> {
  const { runId, pace } = opts;
  const { db, generate, fetchBody } = { ...defaultDeps, ...opts.deps };

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.articleId, articleId))
    .limit(1);
  if (!article || article.status !== "new") return { kind: "noop" };

  const bump = (col: RunCounter) =>
    runId ? incrRun(db, runId, col) : Promise.resolve();
  const skip = async (
    col: RunCounter,
    reason: string,
  ): Promise<ArticleOutcome> => {
    await db
      .update(articles)
      .set({ status: "skipped", skipReason: reason })
      .where(eq(articles.articleId, articleId));
    await bump(col);
    log("info", "article skipped", { runId, articleId, reason });
    return { kind: "skipped", reason };
  };

  if (classifyRelevance(article).drop) {
    return skip("skippedIrrelevant", "irrelevant:prefilter");
  }

  let sourceText = article.summary.trim();

  // A Hindi snippet will not become English by fetching the page.
  if (!isMostlyEnglish(`${article.title} ${sourceText}`)) {
    return skip("skippedNonEnglish", "non_english");
  }

  if (sourceText.length < THIN_SNIPPET_CHARS) {
    const body = await fetchBody(article.url);
    if (body) {
      await bump("bodiesFetched");
      sourceText = `${sourceText}\n\n${body}`.trim().slice(0, MAX_SOURCE_CHARS);
    }
  }

  const source = { title: article.title, summary: sourceText };
  const combined = `${article.title} ${sourceText}`.trim();

  if (combined.length < MIN_SOURCE_CHARS) {
    return skip("skippedThin", "thin_source");
  }
  if (!isMostlyEnglish(combined)) {
    return skip("skippedNonEnglish", "non_english");
  }

  // Paced here, after the free gates, so a skipped article costs no slot.
  await pace?.();

  let draft;
  try {
    draft = await generate(article, sourceText);
  } catch (err) {
    log("warn", "generation call failed", {
      runId,
      articleId,
      error: (err as Error).message,
    });
    return { kind: "error", message: (err as Error).message };
  }

  if (!draft.relevant) {
    return skip("rejectedIrrelevant", "irrelevant:model");
  }

  const grounding = isGrounded(draft, source);
  if (!grounding.ok) {
    return skip("rejectedGrounding", `ungrounded:${grounding.reason}`);
  }

  await db
    .insert(currentAffairsQuestions)
    .values({
      articleId: article.articleId,
      extractedDay: istDayKey(article.publishedAt),
      questionText: draft.questionText,
      options: draft.options,
      answer: draft.answer,
      explanation: draft.explanation,
      topic: draft.topic,
    })
    .onConflictDoNothing({ target: currentAffairsQuestions.articleId });
  await db
    .update(articles)
    .set({ status: "used" })
    .where(eq(articles.articleId, articleId));
  await bump("published");
  log("info", "question published", { runId, articleId, topic: draft.topic });
  return { kind: "published" };
}

export async function runGenerate(
  day?: string,
  opts: RunOptions = {},
): Promise<GenerateResult> {
  const deps = { ...defaultDeps, ...opts.deps };
  const {
    deadlineMs = Infinity,
    rpm = activeProfile.llmMaxRpm,
    now = Date.now,
    sleep,
  } = opts;
  const { db } = deps;

  const expired = await expireStale(db, new Date(now()));
  const rows = await selectNewArticles(db, day);

  const [run] = await db
    .insert(generateRuns)
    .values({ day: day ?? null, planned: rows.length, status: "running" })
    .returning();

  const pacer = createPacer(rpm, { now, sleep });
  const started = now();
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, rows.length) }, async () => {
      while (cursor < rows.length && now() - started < deadlineMs) {
        const a = rows[cursor++];
        const out = await processArticle(a.articleId, {
          runId: run.runId,
          deps,
          pace: pacer.next,
        });
        if (out.kind === "error") {
          await incrRun(db, run.runId, "errors");
          const backoff = retryDelayFromMessage(out.message);
          if (backoff) pacer.delay(Math.min(backoff, 60_000));
        }
      }
    }),
  );

  const leftover = rows.length - cursor;
  const [final] = await db
    .update(generateRuns)
    .set({ finishedAt: new Date(), status: "done" })
    .where(eq(generateRuns.runId, run.runId))
    .returning();

  log("info", "generate run finished", {
    runId: run.runId,
    planned: rows.length,
    published: final.published,
    leftover,
    expired,
  });
  return { ...final, leftover, expired };
}
