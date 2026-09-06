import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { descriptiveMarkings } from "@/db/schema";
import { openrouterConfig } from "@/config/openrouter";
import { openrouter } from "@/lib/openrouter-client/openrouter";
import {
  DESCRIPTIVE_RESPONSE_JSON_SCHEMA,
  DESCRIPTIVE_SYSTEM,
  descriptiveUserPrompt,
} from "@/lib/prompts/descriptive";
import {
  MarkingResponse,
  toMarking,
  type Marking,
  type SavedMarking,
} from "./marking";
import { wordCount, type DescriptiveTask } from "./tasks";

/** Marking is the expensive call in this product, so it uses the accurate model, not the cheap one. */
export async function markAnswer(
  task: DescriptiveTask,
  answer: string,
): Promise<{ marking: Marking; model: string; words: number }> {
  const words = wordCount(answer);
  const reply = await openrouter.ask({
    model: openrouterConfig.model,
    system: DESCRIPTIVE_SYSTEM,
    prompt: descriptiveUserPrompt({
      kind: task.kind,
      title: task.title,
      brief: task.brief,
      min: task.min,
      max: task.max,
      words,
      answer,
    }),
    responseSchema: DESCRIPTIVE_RESPONSE_JSON_SCHEMA,
  });

  const parsed = MarkingResponse.parse(JSON.parse(reply.text));
  return { marking: toMarking(parsed, task.marks), model: reply.model, words };
}

export async function saveMarking(
  db: Db,
  userId: string,
  input: {
    taskId: string;
    answer: string;
    words: number;
    marking: Marking;
    model: string;
  },
): Promise<string> {
  const [row] = await db
    .insert(descriptiveMarkings)
    .values({
      userId,
      taskId: input.taskId,
      answer: input.answer,
      words: input.words,
      // numeric columns take strings; a float here is how money bugs start.
      total: input.marking.total.toFixed(2),
      outOf: input.marking.outOf.toFixed(2),
      marking: input.marking,
      model: input.model,
    })
    .returning({ id: descriptiveMarkings.id });
  return row!.id;
}

const HISTORY_LIMIT = 20;

export async function recentMarkings(
  db: Db,
  userId: string,
): Promise<SavedMarking[]> {
  const rows = await db
    .select({
      id: descriptiveMarkings.id,
      taskId: descriptiveMarkings.taskId,
      answer: descriptiveMarkings.answer,
      words: descriptiveMarkings.words,
      marking: descriptiveMarkings.marking,
      createdAt: descriptiveMarkings.createdAt,
    })
    .from(descriptiveMarkings)
    .where(eq(descriptiveMarkings.userId, userId))
    .orderBy(desc(descriptiveMarkings.createdAt))
    .limit(HISTORY_LIMIT);

  return rows.map((r) => ({
    id: r.id,
    taskId: r.taskId,
    answer: r.answer,
    words: r.words,
    marking: r.marking as Marking,
    createdAt: r.createdAt.toISOString(),
  }));
}
