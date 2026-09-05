import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/lib/gazette/env";
import { activeProfile } from "@/lib/gazette/config/profile";
import type { ArticleRow } from "@/lib/gazette/db/schema";
import type { GeneratedQuestion } from "@/lib/gazette/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

// Gemini's supported JSON-schema subset. The question fields are NOT required —
// when relevant=false the model omits them.
const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    relevant: { type: "boolean" },
    topic: { type: "string" },
    question_text: { type: "string" },
    options: {
      type: "object",
      properties: {
        A: { type: "string" },
        B: { type: "string" },
        C: { type: "string" },
        D: { type: "string" },
      },
      required: ["A", "B", "C", "D"],
      additionalProperties: false,
    },
    answer: { type: "string", enum: ["A", "B", "C", "D"] },
    explanation: { type: "string" },
  },
  required: ["relevant", "topic"],
  additionalProperties: false,
} as const;

// Structured output isn't a hard guarantee — validate what comes back, and
// require the MCQ fields only when the model says the item is relevant.
const McqSchema = z
  .object({
    relevant: z.boolean(),
    topic: z.string(),
    question_text: z.string().optional(),
    options: z
      .object({
        A: z.string().min(1),
        B: z.string().min(1),
        C: z.string().min(1),
        D: z.string().min(1),
      })
      .optional(),
    answer: z.enum(["A", "B", "C", "D"]).optional(),
    explanation: z.string().optional(),
  })
  .refine(
    (v) =>
      !v.relevant ||
      (!!v.question_text &&
        v.question_text.length >= 10 &&
        !!v.options &&
        !!v.answer &&
        !!v.explanation &&
        v.explanation.length >= 10),
    { message: "relevant=true but the MCQ fields are missing or too short" },
  );

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

/**
 * One structured Gemini call → a relevance verdict, and when relevant, one
 * grounded draft MCQ with a topic. `sourceText` is the text to ground in
 * (snippet, or snippet + fetched body). Throws on API or parse error. Retries
 * once on a transient failure (timeout, 5xx, rate limit).
 */
export async function generateQuestion(
  article: ArticleRow,
  sourceText: string,
): Promise<GeneratedQuestion> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: env.GENERATION_MODEL,
        contents: buildUserPrompt(article, sourceText),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: RESPONSE_JSON_SCHEMA,
          maxOutputTokens: 1500,
          temperature: 0.3,
          abortSignal: AbortSignal.timeout(60_000),
        },
      });

      const text = response.text;
      if (!text) throw new Error("generation returned an empty response");

      const parsed = McqSchema.parse(JSON.parse(text));
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
      if (attempt >= 2 || !TRANSIENT.test((err as Error).message)) throw err;
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }
}
