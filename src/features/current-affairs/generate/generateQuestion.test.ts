import { describe, expect, it, vi } from "vitest";

const ask = vi.fn();
vi.mock("@/lib/openrouter-client/openrouter", () => ({
  openrouter: { ask: (...args: unknown[]) => ask(...args) },
}));

const { generateQuestion } = await import("./generateQuestion");

const MCQ = {
  relevant: true,
  topic: "Monetary Policy & RBI",
  question_text: "At what level did the RBI keep the repo rate?",
  options: { A: "6.5%", B: "6.0%", C: "5.5%", D: "7.0%" },
  answer: "A",
  explanation: "The article says the repo rate was held at 6.5%.",
};

const article = {
  title: "RBI holds repo rate",
  source: "newsdata_io",
  scope: "national",
  publishedAt: new Date("2026-09-15T06:00:00Z"),
} as never;

describe("generateQuestion", () => {
  it("reads an object the model wrapped in reasoning and fences", async () => {
    ask.mockResolvedValueOnce({
      text: `analysis: this is clearly relevant.\n\`\`\`json\n${JSON.stringify(MCQ)}\n\`\`\`\nDone.`,
    });

    await expect(generateQuestion(article, "body")).resolves.toMatchObject({
      relevant: true,
      answer: "A",
    });
  });

  it("puts the reply in the error when there is no object to read", async () => {
    ask.mockResolvedValueOnce({ text: "I cannot help with that request." });

    await expect(generateQuestion(article, "body")).rejects.toThrow(
      /model replied: I cannot help/,
    );
  });
});
