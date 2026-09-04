import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  articles,
  generateRuns,
  questions,
  type GenerateRunRow,
  type RunCounter,
} from "@/db/schema";
import { activeProfile } from "@/lib/gazette/config/profile";
import { istDayKey } from "@/lib/gazette/dedup/deduplicator";
import { generateQuestion } from "@/lib/gazette/generate/generateQuestion";
import { isGrounded } from "@/lib/gazette/grounding/check";
import { log } from "@/lib/gazette/log";
import { classifyRelevance } from "@/lib/gazette/relevance/prefilter";
import {
  fetchArticleBody,
  isMostlyEnglish,
} from "@/lib/gazette/sources/extract";

// In the no-queue path (runGenerate) this bounds fan-out; the BullMQ worker
// uses its own `concurrency` + a queue-global rate limiter instead.
const CONCURRENCY = 2;

// RSS snippets (PIB especially) are often headline-only. Fetch the article page
// for anything below this and use snippet + body as the source. Still too thin
// after the fetch → skip rather than spend a generation request.
const THIN_SNIPPET_CHARS = 320;
const MIN_SOURCE_CHARS = 160;
const MAX_SOURCE_CHARS = 6000;

export type GenerateDeps = {
  generate: typeof generateQuestion;
  fetchBody: typeof fetchArticleBody;
};

const defaultDeps: GenerateDeps = {
  generate: generateQuestion,
  fetchBody: fetchArticleBody,
};

/**
 * Outcome of processing one article.
 * - `error` is transient (LLM 5xx/timeout, fetch failure): the article is left
 *   `new`, so the queue job re-throws to retry and a plain re-run picks it up.
 * - everything else is terminal — the article's status is already updated.
 */
export type ArticleOutcome =
  | { kind: "published" }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; message: string }
  | { kind: "noop" }; // wasn't `new` — already processed

// IST day string -> [startUtc, endUtc) covering that day.
function istDayBounds(day: string): [Date, Date] {
  const start = new Date(`${day}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 86_400_000);
  return [start, end];
}

export async function incrRun(
  runId: string,
  col: RunCounter,
  n = 1,
): Promise<void> {
  await db
    .update(generateRuns)
    .set({ [col]: sql`${generateRuns[col]} + ${n}` })
    .where(eq(generateRuns.runId, runId));
}

/** Articles this run will process — status `new`, optionally one IST day, capped. */
export async function selectNewArticles(day?: string) {
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

/**
 * The per-article unit: prefilter → enrich → thin/English gate → one LLM call →
 * grounding → write. Re-reads the article first, so a retry after the DB write
 * is a no-op (belt to the `questions.article_id` unique index's braces).
 *
 * `deps` is injectable — tests pass fakes so the LLM and outbound HTTP never
 * run in the suite.
 */
export async function processArticle(
  articleId: string,
  opts: { runId?: string; deps?: GenerateDeps } = {},
): Promise<ArticleOutcome> {
  const { runId, deps = defaultDeps } = opts;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.articleId, articleId))
    .limit(1);
  if (!article || article.status !== "new") return { kind: "noop" };

  const bump = (col: RunCounter) =>
    runId ? incrRun(runId, col) : Promise.resolve();
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
  if (sourceText.length < THIN_SNIPPET_CHARS) {
    const body = await deps.fetchBody(article.url);
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

  let draft;
  try {
    draft = await deps.generate(article, sourceText);
  } catch (err) {
    // Transient — leave status `new`. The queue job re-throws so BullMQ retries.
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
    .insert(questions)
    .values({
      articleId: article.articleId,
      extractedDay: istDayKey(article.publishedAt),
      questionText: draft.questionText,
      options: draft.options,
      answer: draft.answer,
      explanation: draft.explanation,
      topic: draft.topic,
    })
    .onConflictDoNothing({ target: questions.articleId });
  await db
    .update(articles)
    .set({ status: "used" })
    .where(eq(articles.articleId, articleId));
  await bump("published");
  log("info", "question published", { runId, articleId, topic: draft.topic });
  return { kind: "published" };
}

/**
 * Whole-batch run without a queue — used by `bun run pipeline generate` and the
 * integration tests. The BullMQ path fans the same `processArticle` calls out
 * as individual jobs instead.
 */
export async function runGenerate(
  day?: string,
  deps: GenerateDeps = defaultDeps,
): Promise<GenerateRunRow> {
  const rows = await selectNewArticles(day);

  const [run] = await db
    .insert(generateRuns)
    .values({ day: day ?? null, planned: rows.length, status: "running" })
    .returning();

  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, rows.length) }, async () => {
      while (cursor < rows.length) {
        const a = rows[cursor++];
        const out = await processArticle(a.articleId, {
          runId: run.runId,
          deps,
        });
        if (out.kind === "error") await incrRun(run.runId, "errors");
      }
    }),
  );

  const [final] = await db
    .update(generateRuns)
    .set({ finishedAt: new Date(), status: "done" })
    .where(eq(generateRuns.runId, run.runId))
    .returning();
  return final;
}
