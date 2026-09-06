import { describe, expect, it } from "vitest";

import {
  type GradedAnswer,
  isCorrect,
  scoreBySection,
  scoreByTopic,
  scoreTimeline,
  scoreTotals,
} from "./scoring";

const a = (over: Partial<GradedAnswer>): GradedAnswer => ({
  qId: "q1",
  section: "Quantitative",
  topic: "Arithmetic",
  chosen: "a",
  correct: "a",
  marks: 1,
  negativeMarks: 0.25,
  timeMs: 30_000,
  ...over,
});

describe("isCorrect", () => {
  it("is case-insensitive on the option key", () => {
    expect(isCorrect("B", "b")).toBe(true);
    expect(isCorrect("b", "B")).toBe(true);
  });

  it("treats a blank as never correct", () => {
    expect(isCorrect(null, "a")).toBe(false);
  });
});

describe("scoreTotals", () => {
  it("applies negative marking only to wrong answers, never to blanks", () => {
    const totals = scoreTotals([
      a({ chosen: "a", correct: "a" }), // correct: +1
      a({ chosen: "b", correct: "a" }), // wrong: -0.25
      a({ chosen: null, correct: "a" }), // blank: 0
    ]);
    expect(totals).toMatchObject({
      attempted: 2,
      correct: 1,
      wrong: 1,
      skipped: 1,
      score: 0.75,
      maxScore: 3,
    });
  });

  it("lets the score go negative rather than clamping at zero", () => {
    const totals = scoreTotals([
      a({ chosen: "b", correct: "a" }),
      a({ chosen: "b", correct: "a" }),
      a({ chosen: "b", correct: "a" }),
    ]);
    expect(totals.score).toBe(-0.75);
  });

  it("an all-blank attempt scores zero with zero accuracy, not NaN", () => {
    const totals = scoreTotals([a({ chosen: null }), a({ chosen: null })]);
    expect(totals).toMatchObject({ attempted: 0, score: 0, accuracy: 0 });
  });

  it("an all-correct attempt has 100% accuracy", () => {
    const totals = scoreTotals([a({}), a({})]);
    expect(totals).toMatchObject({ correct: 2, wrong: 0, accuracy: 100 });
  });

  it("computes accuracy against attempted questions, not the full set", () => {
    // 1 correct out of 1 attempted (the blank doesn't count as a miss).
    const totals = scoreTotals([a({ chosen: "a" }), a({ chosen: null })]);
    expect(totals.accuracy).toBe(100);
  });

  it("respects a per-question negativeMarks that differs from the app default", () => {
    const totals = scoreTotals([
      a({ chosen: "b", correct: "a", negativeMarks: 0.5 }),
    ]);
    expect(totals.score).toBe(-0.5);
  });
});

describe("net per section", () => {
  // Quant carried, English blank: the shape that used to read as "cleared".
  const answers = [
    ...Array.from({ length: 6 }, (_, i) =>
      a({ qId: `q${i}`, section: "Quantitative", chosen: "a", correct: "a" }),
    ),
    ...Array.from({ length: 2 }, (_, i) =>
      a({ qId: `w${i}`, section: "Quantitative", chosen: "b", correct: "a" }),
    ),
    ...Array.from({ length: 8 }, (_, i) =>
      a({ qId: `e${i}`, section: "English", chosen: null }),
    ),
  ];

  it("takes the penalty off each section's net", () => {
    const s = scoreBySection(answers);
    expect(s.get("Quantitative")!.marksEarned).toBe(6);
    expect(s.get("Quantitative")!.marksLost).toBe(0.5);
    expect(s.get("Quantitative")!.net).toBe(5.5);
    expect(s.get("English")!.net).toBe(0);
  });

  it("counts every question in a section, attempted or not", () => {
    const s = scoreBySection(answers);
    expect(s.get("Quantitative")!.questions).toBe(8);
    expect(s.get("English")!.skipped).toBe(8);
  });
});

describe("scoreBySection", () => {
  it("keeps every section that appears, even one with only blanks", () => {
    const bySection = scoreBySection([
      a({ section: "Quantitative", chosen: "a", correct: "a" }),
      a({ section: "Reasoning", chosen: null }),
    ]);
    expect(bySection.get("Quantitative")).toMatchObject({
      correct: 1,
      marksEarned: 1,
    });
    expect(bySection.get("Reasoning")).toMatchObject({
      attempted: 0,
      correct: 0,
      skipped: 1,
      marksEarned: 0,
      marksLost: 0,
    });
  });
});

describe("scoreByTopic", () => {
  it("drops questions with no topic classification rather than grouping them", () => {
    const byTopic = scoreByTopic([
      a({ topic: null }),
      a({ section: "English", topic: "Vocabulary", chosen: "a", correct: "a" }),
    ]);
    expect(byTopic.size).toBe(1);
    expect(byTopic.get("English::Vocabulary")).toMatchObject({
      attempted: 1,
      correct: 1,
    });
  });

  it("ranks marksLost by mark + negative-marking penalty, not by wrong-answer count", () => {
    const byTopic = scoreByTopic([
      // One high-value wrong answer.
      a({
        topic: "A",
        marks: 2,
        negativeMarks: 0.5,
        chosen: "b",
        correct: "a",
      }),
      // Two low-value wrong answers — more misses, less actually lost.
      a({
        topic: "B",
        marks: 0.5,
        negativeMarks: 0.25,
        chosen: "b",
        correct: "a",
      }),
      a({
        topic: "B",
        marks: 0.5,
        negativeMarks: 0.25,
        chosen: "b",
        correct: "a",
      }),
    ]);
    expect(byTopic.get("Quantitative::A")?.marksLost).toBe(2.5);
    expect(byTopic.get("Quantitative::B")?.marksLost).toBe(1.5);
  });

  it("a blank contributes nothing to marksLost", () => {
    const byTopic = scoreByTopic([a({ chosen: null })]);
    expect(byTopic.get("Quantitative::Arithmetic")?.marksLost).toBe(0);
  });

  it("averages time only over questions that recorded one", () => {
    const byTopic = scoreByTopic([
      a({ timeMs: 10_000 }),
      a({ timeMs: 30_000 }),
      a({ timeMs: null }),
    ]);
    expect(byTopic.get("Quantitative::Arithmetic")?.avgTimeSec).toBe(20);
  });
});

describe("scoreTimeline", () => {
  it("advances elapsed time on a blank but doesn't move the score line", () => {
    const timeline = scoreTimeline([
      a({ chosen: "a", correct: "a", timeMs: 20_000 }),
      a({ chosen: null, timeMs: 10_000 }),
    ]);
    expect(timeline).toEqual([
      { index: 1, elapsedSec: 20, cumulativeScore: 1 },
      { index: 2, elapsedSec: 30, cumulativeScore: 1 },
    ]);
  });
});
