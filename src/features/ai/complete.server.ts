import "server-only";

import { chat, type ChatMessage, type ChatResponse } from "@/lib/llm";

import { PROFILES, type FeatureKey } from "./profiles";
import { record, withinBudget } from "./usage.server";

export type { ChatMessage, ChatResponse };

export class BudgetExceededError extends Error {
  constructor(readonly spentMicros: number, readonly capMicros: number) {
    super("monthly AI budget exhausted");
    this.name = "BudgetExceededError";
  }
}

/**
 * Wraps `chat` rather than re-exporting it so no caller can skip the spend cap
 * or forget to meter.
 */
export async function complete(
  userId: string,
  feature: FeatureKey,
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const budget = await withinBudget(userId);
  if (!budget.allowed) {
    throw new BudgetExceededError(budget.spentMicros, budget.capMicros);
  }

  const profile = PROFILES[feature];
  const response = await chat(messages, {
    model: profile.model,
    fallbackModel: "fallbackModel" in profile ? profile.fallbackModel : undefined,
    temperature: profile.temperature,
    maxTokens: profile.maxTokens,
    timeoutMs: profile.timeoutMs,
  });

  // Recorded even though the answer is already in hand: an unrecorded call is
  // spend the cap cannot see.
  await record(userId, feature, response);
  return response;
}
