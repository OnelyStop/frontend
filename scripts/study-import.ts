#!/usr/bin/env bun
/**
 * Idempotent importer: content/*.topic.json  ->  Postgres.
 *
 *   bun scripts/study-import.ts                 # every topic under content/
 *   bun scripts/study-import.ts --dir content/english
 *   bun scripts/study-import.ts --file content/english/grammar/tenses.topic.json
 *   bun scripts/study-import.ts --allow-invalid # skip the validation gate
 *
 * Idempotency: subjects/chapters/topics upsert on their natural key. Block and
 * flashcard rows are keyed by (content version, stable key); a content version
 * carries a source_hash, so re-running an unchanged file is a no-op and an
 * edited file at the same contentVersion is replaced in place. Bump
 * contentVersion in the JSON to keep the previous version's rows.
 *
 * Connects with STUDY_DATABASE_URL, falling back to DATABASE_URL.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { validateTopic } from "./study-validate.mjs";
import * as schema from "../src/db/schema";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type Json = Record<string, unknown>;

// --- pure projection (exported for tests) --------------------------------

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Json;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

export function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Everything that decides whether a content version changed. */
export function sourceHashOf(topic: Json): string {
  const blocks = (topic.blocks as Json[] | undefined) ?? [];
  const flashcards = (topic.flashcards as Json[] | undefined) ?? [];
  const sources = (topic.sources as Json[] | undefined) ?? [];
  const canonical = {
    meta: {
      title: topic.title,
      summary: topic.summary,
      difficulty: topic.difficulty,
      estimatedMinutes: topic.estimatedMinutes,
      examTags: topic.examTags ?? [],
      prerequisiteTopicSlugs: topic.prerequisiteTopicSlugs ?? [],
      learningObjectives: topic.learningObjectives ?? [],
      tags: topic.tags ?? [],
      reviewCadenceDays: topic.reviewCadenceDays,
    },
    blocks: [...blocks]
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((b) => ({
        stableKey: b.id,
        type: b.type,
        title: b.title,
        bodyMarkdown: b.markdown,
        searchKeywords: b.searchKeywords ?? [],
        position: b.position,
        sourceIds: [...((b.sourceIds as string[] | undefined) ?? [])].sort(),
      })),
    sources: [...sources]
      .map((s) => ({
        registryKey: s.sourceId,
        url: s.url,
        title: s.title,
        publisher: s.publisher,
        usageMode: s.usageMode,
        license: s.license ?? null,
        retrievedAt: s.retrievedAt,
        sourceUpdatedAt: s.sourceUpdatedAt ?? null,
        notes: s.notes ?? null,
      }))
      .sort((a, b) =>
        `${a.url}${a.retrievedAt}`.localeCompare(`${b.url}${b.retrievedAt}`),
      ),
    flashcards: [...flashcards]
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((c) => ({
        stableKey: c.id,
        front: c.front,
        back: c.back,
        explanation: c.explanation ?? null,
        difficulty: c.difficulty,
        sourceBlockKeys: [
          ...((c.sourceBlockIds as string[] | undefined) ?? []),
        ],
        status: c.status ?? "draft",
        position: c.position,
      })),
  };
  return createHash("sha256").update(stableStringify(canonical)).digest("hex");
}

// --- runner -------------------------------------------------------------

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".topic.json")) out.push(full);
  }
  return out;
}

type DB = ReturnType<typeof drizzle<typeof schema>>;

async function importTopic(db: DB, file: string, topic: Json) {
  const rel = relative(ROOT, file);
  const s = schema;

  return db.transaction(async (tx) => {
    // Subject.
    const subjectSlug = topic.subjectSlug as string;
    const existingSubject = await tx.query.subjects.findFirst({
      where: eq(s.subjects.slug, subjectSlug),
    });
    const subjectId =
      existingSubject?.id ??
      (
        await tx
          .insert(s.subjects)
          .values({
            slug: subjectSlug,
            name:
              (topic.subjectName as string) ?? titleCaseFromSlug(subjectSlug),
            position: (topic.subjectPosition as number) ?? 999,
          })
          .returning({ id: s.subjects.id })
      )[0].id;
    if (existingSubject && topic.subjectName)
      await tx
        .update(s.subjects)
        .set({ name: topic.subjectName as string })
        .where(eq(s.subjects.id, subjectId));

    // Chapter.
    const chapterSlug = topic.chapterSlug as string;
    const existingChapter = await tx.query.chapters.findFirst({
      where: and(
        eq(s.chapters.subjectId, subjectId),
        eq(s.chapters.slug, chapterSlug),
      ),
    });
    const chapterId =
      existingChapter?.id ??
      (
        await tx
          .insert(s.chapters)
          .values({
            subjectId,
            slug: chapterSlug,
            name:
              (topic.chapterName as string) ?? titleCaseFromSlug(chapterSlug),
            position: (topic.chapterPosition as number) ?? 999,
          })
          .returning({ id: s.chapters.id })
      )[0].id;
    if (existingChapter && topic.chapterName)
      await tx
        .update(s.chapters)
        .set({ name: topic.chapterName as string })
        .where(eq(s.chapters.id, chapterId));

    // Topic.
    const topicSlug = topic.topicSlug as string;
    const status = (topic.contentStatus as string) ?? "draft";
    const version = (topic.contentVersion as number) ?? 1;
    const lastReviewedAt = topic.lastReviewedAt
      ? new Date(topic.lastReviewedAt as string)
      : null;
    const topicValues = {
      chapterId,
      slug: topicSlug,
      position: (topic.topicPosition as number) ?? 0,
      title: topic.title as string,
      summary: topic.summary as string,
      difficulty: topic.difficulty as string,
      estimatedMinutes: topic.estimatedMinutes as number,
      examTags: (topic.examTags as string[]) ?? [],
      prerequisiteTopicSlugs: (topic.prerequisiteTopicSlugs as string[]) ?? [],
      learningObjectives: (topic.learningObjectives as string[]) ?? [],
      tags: (topic.tags as string[]) ?? [],
      status: status as (typeof s.contentStatus.enumValues)[number],
      currentVersion: version,
      reviewCadenceDays: (topic.reviewCadenceDays as number) ?? 365,
      lastReviewedAt,
    };
    const existingTopic = await tx.query.topics.findFirst({
      where: and(
        eq(s.topics.chapterId, chapterId),
        eq(s.topics.slug, topicSlug),
      ),
    });
    let topicId: string;
    if (existingTopic) {
      topicId = existingTopic.id;
      await tx
        .update(s.topics)
        .set({
          ...topicValues,
          publishedAt:
            status === "published"
              ? (existingTopic.publishedAt ?? new Date())
              : existingTopic.publishedAt,
        })
        .where(eq(s.topics.id, topicId));
    } else {
      topicId = (
        await tx
          .insert(s.topics)
          .values({
            ...topicValues,
            publishedAt: status === "published" ? new Date() : null,
          })
          .returning({ id: s.topics.id })
      )[0].id;
    }

    // Content version — the idempotency pivot.
    const hash = sourceHashOf(topic);
    const existingVersion = await tx.query.contentVersions.findFirst({
      where: and(
        eq(s.contentVersions.topicId, topicId),
        eq(s.contentVersions.version, version),
      ),
    });

    let outcome: "unchanged" | "created" | "updated";
    let versionId: string;
    if (existingVersion && existingVersion.sourceHash === hash) {
      return {
        rel,
        outcome: "unchanged" as const,
        blocks: 0,
        flashcards: 0,
      };
    }
    if (existingVersion) {
      versionId = existingVersion.id;
      outcome = "updated";
      await tx
        .delete(s.contentBlocks)
        .where(eq(s.contentBlocks.contentVersionId, versionId));
      await tx
        .delete(s.flashcards)
        .where(
          and(
            eq(s.flashcards.topicId, topicId),
            eq(s.flashcards.contentVersion, version),
          ),
        );
      await tx
        .update(s.contentVersions)
        .set({
          sourceHash: hash,
          authoredBy: (topic.authoredBy as string) ?? null,
          reviewedBy: (topic.reviewedBy as string) ?? null,
          reviewNotes: (topic.reviewNotes as string) ?? null,
        })
        .where(eq(s.contentVersions.id, versionId));
    } else {
      outcome = "created";
      versionId = (
        await tx
          .insert(s.contentVersions)
          .values({
            topicId,
            version,
            sourceHash: hash,
            authoredBy: (topic.authoredBy as string) ?? null,
            reviewedBy: (topic.reviewedBy as string) ?? null,
            reviewNotes: (topic.reviewNotes as string) ?? null,
          })
          .returning({ id: s.contentVersions.id })
      )[0].id;
    }

    // Sources: dedup on (url, retrievedAt) across the whole corpus.
    const sourceIdByRegistryKey = new Map<string, string>();
    for (const src of (topic.sources as Json[] | undefined) ?? []) {
      const url = src.url as string;
      const retrievedAt = new Date(src.retrievedAt as string);
      const found = await tx.query.contentSources.findFirst({
        where: and(
          eq(s.contentSources.url, url),
          eq(s.contentSources.retrievedAt, retrievedAt),
        ),
      });
      const id =
        found?.id ??
        (
          await tx
            .insert(s.contentSources)
            .values({
              registryKey: (src.sourceId as string) ?? null,
              url,
              title: src.title as string,
              publisher: src.publisher as string,
              usageMode: src.usageMode as string,
              license: (src.license as string) ?? null,
              retrievedAt,
              sourceUpdatedAt: src.sourceUpdatedAt
                ? new Date(src.sourceUpdatedAt as string)
                : null,
              notes: (src.notes as string) ?? null,
            })
            .returning({ id: s.contentSources.id })
        )[0].id;
      if (src.sourceId) sourceIdByRegistryKey.set(src.sourceId as string, id);
    }

    // Blocks + block->source links.
    const blocks = [...((topic.blocks as Json[] | undefined) ?? [])].sort(
      (a, b) => Number(a.position) - Number(b.position),
    );
    let blockCount = 0;
    for (const b of blocks) {
      const [{ id: blockId }] = await tx
        .insert(s.contentBlocks)
        .values({
          contentVersionId: versionId,
          stableKey: b.id as string,
          type: b.type as string,
          title: b.title as string,
          bodyMarkdown: b.markdown as string,
          searchKeywords: (b.searchKeywords as string[]) ?? [],
          position: b.position as number,
        })
        .returning({ id: s.contentBlocks.id });
      blockCount++;
      const linkIds = ((b.sourceIds as string[] | undefined) ?? [])
        .map((key) => sourceIdByRegistryKey.get(key))
        .filter((v): v is string => Boolean(v));
      if (linkIds.length)
        await tx
          .insert(s.contentBlockSources)
          .values(linkIds.map((sourceId) => ({ blockId, sourceId })))
          .onConflictDoNothing();
    }

    // Flashcards.
    const cards = [...((topic.flashcards as Json[] | undefined) ?? [])].sort(
      (a, b) => Number(a.position) - Number(b.position),
    );
    if (cards.length)
      await tx.insert(s.flashcards).values(
        cards.map((c) => ({
          topicId,
          contentVersion: version,
          stableKey: c.id as string,
          front: c.front as string,
          back: c.back as string,
          explanation: (c.explanation as string) ?? null,
          difficulty: c.difficulty as string,
          sourceBlockKeys: (c.sourceBlockIds as string[]) ?? [],
          status: ((c.status as string) ??
            "draft") as (typeof s.flashcardStatus.enumValues)[number],
          position: c.position as number,
          generatedBy: (topic.authoredBy as string) ?? null,
        })),
      );

    return { rel, outcome, blocks: blockCount, flashcards: cards.length };
  });
}

async function main() {
  config({ path: join(ROOT, ".env.local") });
  const args = process.argv.slice(2);
  const allowInvalid = args.includes("--allow-invalid");
  const fileArg = args.indexOf("--file");
  const dirArg = args.indexOf("--dir");

  const files =
    fileArg >= 0
      ? [join(ROOT, args[fileArg + 1])]
      : walk(join(ROOT, dirArg >= 0 ? args[dirArg + 1] : "content"));
  if (files.length === 0) {
    console.error("no *.topic.json to import");
    process.exit(1);
  }

  const url = process.env.STUDY_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("STUDY_DATABASE_URL / DATABASE_URL is not set");
    process.exit(1);
  }

  const registry = JSON.parse(
    readFileSync(join(ROOT, "content/source-registry.json"), "utf8"),
  );
  const topicSchema = JSON.parse(
    readFileSync(join(ROOT, "schemas/study-topic.schema.json"), "utf8"),
  );

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const summary = {
    created: 0,
    updated: 0,
    unchanged: 0,
    blocks: 0,
    flashcards: 0,
  };
  let failed = 0;
  try {
    for (const file of files) {
      const rel = relative(ROOT, file);
      const topic = JSON.parse(readFileSync(file, "utf8"));
      const { errors } = validateTopic(topic, {
        schema: topicSchema,
        registry,
      });
      if (errors.length && !allowInvalid) {
        console.error(
          `✗ ${rel} — ${errors.length} validation error(s), skipped`,
        );
        for (const e of errors) console.error(`    ${e}`);
        failed++;
        continue;
      }
      const res = await importTopic(db, file, topic);
      summary[res.outcome]++;
      summary.blocks += res.blocks;
      summary.flashcards += res.flashcards;
      console.log(
        `${res.outcome === "unchanged" ? "=" : "→"} ${res.rel}  [${res.outcome}]`,
      );
    }
  } finally {
    await client.end();
  }

  console.log(
    `\nversions: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged` +
      `\nrows written: ${summary.blocks} blocks, ${summary.flashcards} flashcards`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) void main();
