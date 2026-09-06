import { activeProfile } from "@/features/current-affairs/config/profile";
import { env } from "@/features/current-affairs/env";
import type { ArticleRow } from "@/db/schema";
import type { GeneratedQuestion } from "@/features/current-affairs/types";
import { openrouter } from "@/lib/openrouter-client/openrouter";
import {
  MCQ_RESPONSE_JSON_SCHEMA,
  McqResponse,
  currentAffairsSystem,
  currentAffairsUserPrompt,
} from "@/lib/prompts/current-affairs";

function normalizeTopic(raw: string): string {
  const hit = activeProfile.topics.find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase(),
  );
  return hit ?? "Miscellaneous";
}

// Retries, model fallback and the total deadline all live in the client.
export async function generateQuestion(
  article: ArticleRow,
  sourceText: string,
): Promise<GeneratedQuestion> {
  const answer = await openrouter.ask({
    model: env.GENERATION_MODEL,
    system: currentAffairsSystem(activeProfile.topics),
    prompt: currentAffairsUserPrompt(article, sourceText),
    temperature: 0.3,
    maxTokens: 1500,
    responseSchema: { name: "mcq", schema: MCQ_RESPONSE_JSON_SCHEMA },
  });

  const parsed = McqResponse.parse(JSON.parse(answer.text));
  if (!parsed.relevant) return { relevant: false };

  return {
    relevant: true,
    topic: normalizeTopic(parsed.topic),
    questionText: parsed.question_text!,
    options: parsed.options!,
    answer: parsed.answer!,
    explanation: parsed.explanation!,
  };
}
