import { openrouterConfig } from "@/config/openrouter";
import { activeProfile } from "@/features/current-affairs/config/profile";
import type { ArticleRow } from "@/db/schema";
import type { GeneratedQuestion } from "@/features/current-affairs/types";
import { openrouter } from "@/lib/openrouter-client/openrouter";
import {
  MCQ_RESPONSE_JSON_SCHEMA,
  McqResponse,
  currentAffairsSystem,
  currentAffairsUserPrompt,
} from "@/lib/prompts/current-affairs";

// gpt-oss-120b answers with its reasoning around the object often enough that a third of one run died on JSON.parse. Take the object out, and when there is none, put the reply in the error so the next failure is diagnosable from the log alone.
function parseAnswer(text: string): McqResponse {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const body = (fenced ?? text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  const object =
    start === -1 || end <= start ? null : body.slice(start, end + 1);
  try {
    if (!object) throw new Error("no JSON object in the reply");
    return McqResponse.parse(JSON.parse(object));
  } catch (err) {
    throw new Error(
      `${(err as Error).message} | model replied: ${text.slice(0, 200)}`,
    );
  }
}

function normalizeTopic(raw: string): string {
  const hit = activeProfile.topics.find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase(),
  );
  return hit ?? "Miscellaneous";
}

export async function generateQuestion(
  article: ArticleRow,
  sourceText: string,
): Promise<GeneratedQuestion> {
  const answer = await openrouter.ask({
    model: activeProfile.generationModel,
    // Not the shared gpt-4o fallback, which costs 60x the call it would be replacing.
    fallbackModel: openrouterConfig.cheapModel,
    system: currentAffairsSystem(activeProfile.topics),
    prompt: currentAffairsUserPrompt(article, sourceText),
    temperature: 0.3,
    maxTokens: 1500,
    responseSchema: { name: "mcq", schema: MCQ_RESPONSE_JSON_SCHEMA },
  });

  const parsed = parseAnswer(answer.text);
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
