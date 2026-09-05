import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/gazette/env";
import { activeProfile } from "@/lib/gazette/config/profile";
import type { ArticleRow } from "@/db/schema";
import type { GeneratedQuestion } from "@/lib/gazette/types";
import { retryDelayFromMessage } from "@/lib/gazette/pipeline/pace";
import {
  CURRENT_AFFAIRS_SYSTEM,
  MCQ_RESPONSE_JSON_SCHEMA,
  McqResponse,
  currentAffairsUserPrompt,
} from "@/lib/prompts/current-affairs";

let client: GoogleGenAI | undefined;
function getClient(): GoogleGenAI {
  return (client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }));
}

const TRANSIENT =
  /aborted|timed out|timeout|\b(?:429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i;

function normalizeTopic(raw: string): string {
  const hit = activeProfile.topics.find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase(),
  );
  return hit ?? "Miscellaneous";
}

// Retries once on a transient failure; throws on API or parse error.
export async function generateQuestion(
  article: ArticleRow,
  sourceText: string,
): Promise<GeneratedQuestion> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: env.GENERATION_MODEL,
        contents: currentAffairsUserPrompt(article, sourceText),
        config: {
          systemInstruction: CURRENT_AFFAIRS_SYSTEM,
          responseMimeType: "application/json",
          responseJsonSchema: MCQ_RESPONSE_JSON_SCHEMA,
          maxOutputTokens: 1500,
          temperature: 0.3,
          // Thinking is billed as output. An MCQ needs none, and this holds
          // whichever model GENERATION_MODEL is pointed at.
          thinkingConfig: { thinkingBudget: 0 },
          abortSignal: AbortSignal.timeout(60_000),
        },
      });

      const text = response.text;
      if (!text) throw new Error("generation returned an empty response");

      const parsed = McqResponse.parse(JSON.parse(text));
      if (!parsed.relevant) return { relevant: false };

      return {
        relevant: true,
        topic: normalizeTopic(parsed.topic),
        questionText: parsed.question_text!,
        options: parsed.options!,
        answer: parsed.answer!,
        explanation: parsed.explanation!,
      };
    } catch (err) {
      const message = (err as Error).message;
      if (attempt >= 2 || !TRANSIENT.test(message)) throw err;
      const wait = Math.min(retryDelayFromMessage(message) ?? 2_000, 60_000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
