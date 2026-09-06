import { describe, expect, it } from "vitest";
import type { DraftQuestion } from "@/lib/gazette/types";
import { isGrounded } from "./check";

const source = {
  title: "RBI keeps repo rate at 6.5%",
  summary:
    "The Monetary Policy Committee, chaired by Sanjay Malhotra, left the repo rate unchanged at 6.5% on Friday.",
};

const draft = (over: Partial<DraftQuestion> = {}): DraftQuestion => ({
  questionText: "At what rate did the RBI hold the repo rate?",
  options: { A: "6.5%", B: "6%", C: "7%", D: "5.5%" },
  answer: "A",
  explanation: "The RBI kept the repo rate at 6.5%.",
  ...over,
});

describe("isGrounded", () => {
  it("accepts an answer that appears verbatim", () => {
    expect(isGrounded(draft(), source).ok).toBe(true);
  });

  it("accepts a number the source states in another spelling", () => {
    const q = draft({
      options: { A: "6.50 per cent", B: "6", C: "7", D: "5" },
    });
    expect(isGrounded(q, source).ok).toBe(true);
  });

  it("tolerates an honorific the snippet does not carry", () => {
    const q = draft({
      options: { A: "Shri Sanjay Malhotra", B: "X", C: "Y", D: "Z" },
      explanation: "He chaired the committee.",
    });
    expect(isGrounded(q, source).ok).toBe(true);
  });

  it("rejects an answer the source never states", () => {
    const q = draft({ options: { A: "8%", B: "6%", C: "7%", D: "5.5%" } });
    const r = isGrounded(q, source);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("not grounded");
  });

  it("rejects an explanation that cites a number absent from the source", () => {
    const q = draft({ explanation: "The rate was cut by 50 bps." });
    expect(isGrounded(q, source)).toEqual({
      ok: false,
      reason: "explanation cites a number absent from source",
    });
  });

  it("rejects an empty source outright", () => {
    expect(isGrounded(draft(), { title: "", summary: "" }).ok).toBe(false);
  });
});
