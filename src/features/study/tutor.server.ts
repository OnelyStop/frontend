import "server-only";

import { OpenRouterClient } from "@/lib/openrouter-client/openrouter";
import { AiError } from "@/lib/openrouter-client/openrouter-types";
import { buildTutorContext } from "./context";
import { renderTutorPrompt, TUTOR_SYSTEM } from "./tutor-prompt";
import {
  getOwnedConversation,
  loadTutorRetrieval,
  saveTutorTurn,
} from "./queries.server";

// A feature client: shorter answers, low temperature. Model + fallback come
// from src/config/openrouter.ts unless overridden by env.
const client = new OpenRouterClient({ maxTokens: 900, temperature: 0.2 });

export type TutorAsk = {
  question: string;
  selectedBlockKey: string | null;
  includeMyNotes: boolean;
};

export type TutorResult =
  | { answer: string; citedBlockKeys: string[] }
  | {
      error:
        | "not_found"
        | "unauthorized"
        | "rate_limited"
        | "timeout"
        | "upstream"
        | "bad_request";
    };

function parseTutorJson(
  text: string,
  allowedKeys: string[],
): { answer: string; citedBlockKeys: string[] } {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const obj = JSON.parse(stripped) as {
      answer?: unknown;
      citedBlockKeys?: unknown;
    };
    if (obj && typeof obj.answer === "string") {
      const cited = Array.isArray(obj.citedBlockKeys)
        ? obj.citedBlockKeys.filter(
            (k): k is string =>
              typeof k === "string" && allowedKeys.includes(k),
          )
        : [];
      return { answer: obj.answer.trim(), citedBlockKeys: [...new Set(cited)] };
    }
  } catch {
    // Model did not return JSON — fall back to the raw text, no citations.
  }
  return { answer: text.trim(), citedBlockKeys: [] };
}

export async function answerInConversation(
  userId: string,
  conversationId: string,
  ask: TutorAsk,
): Promise<TutorResult> {
  const conv = await getOwnedConversation(userId, conversationId);
  if (!conv) return { error: "not_found" };

  const retrieval = await loadTutorRetrieval(
    conv,
    ask.question,
    userId,
    ask.includeMyNotes,
  );
  if (!retrieval) return { error: "not_found" };

  const ctx = buildTutorContext({
    topic: retrieval.topic,
    selectedBlockKey: ask.selectedBlockKey,
    allBlocks: retrieval.allBlocks,
    ftsBlockKeys: retrieval.ftsBlockKeys,
    history: retrieval.history,
    notes: retrieval.notes,
    includeMyNotes: ask.includeMyNotes,
  });

  const prompt = renderTutorPrompt({
    topicTitle: retrieval.topic.title,
    topicSummary: retrieval.topic.summary,
    learningObjectives: retrieval.topic.learningObjectives,
    selectedBlockKey: ask.selectedBlockKey,
    blocks: ctx.blocks,
    notes: ctx.notes,
    question: ask.question,
  });

  let text: string;
  let completionTokens: number | null = null;
  try {
    const res = await client.ask({
      system: TUTOR_SYSTEM,
      history: ctx.history,
      prompt,
    });
    text = res.text;
    completionTokens = res.completionTokens || null;
  } catch (error) {
    if (error instanceof AiError) return { error: error.kind };
    return { error: "upstream" };
  }

  const parsed = parseTutorJson(text, ctx.includedKeys);
  await saveTutorTurn(
    conversationId,
    ask.question,
    parsed.answer,
    parsed.citedBlockKeys,
    completionTokens,
  );
  return parsed;
}
