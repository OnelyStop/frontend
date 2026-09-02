import { describe, expect, it } from "vitest";
import { buildTutorContext, type ContextInput } from "./context";

/* The chatbot must never see more than the current topic version, a capped
   history, and (opt-in) the learner's own notes (spec §6, §10). These pin that
   boundary so a refactor of the retrieval code can't quietly widen it. */

const block = (
  stableKey: string,
  type: string,
  body = `body of ${stableKey}`,
  position = 0,
) => ({
  stableKey,
  type,
  title: `Title ${stableKey}`,
  bodyMarkdown: body,
  position,
});

const base = (over: Partial<ContextInput> = {}): ContextInput => ({
  topic: { title: "Percentages", summary: "…", learningObjectives: ["a", "b"] },
  selectedBlockKey: "sel",
  allBlocks: [
    block("intro", "introduction", "x", 10),
    block("sel", "concept", "x", 20),
    block("form", "formula", "x", 30),
    block("plain", "method", "x", 40),
    block("sum", "summary", "x", 50),
  ],
  ftsBlockKeys: [],
  history: [],
  notes: [],
  includeMyNotes: false,
  ...over,
});

describe("buildTutorContext", () => {
  it("includes the selected block even when nothing else points at it", () => {
    const ctx = buildTutorContext(base({ ftsBlockKeys: [] }));
    expect(ctx.includedKeys).toContain("sel");
  });

  it("always pulls in definition / formula / summary blocks", () => {
    const ctx = buildTutorContext(base());
    expect(ctx.includedKeys).toEqual(expect.arrayContaining(["form", "sum"]));
  });

  it("does not include an unrelated block that is not selected, always-in, or an FTS hit", () => {
    const ctx = buildTutorContext(base());
    expect(ctx.includedKeys).not.toContain("plain");
    expect(ctx.includedKeys).not.toContain("intro");
  });

  it("can never invent a block key the topic version does not contain", () => {
    const ctx = buildTutorContext(
      base({ ftsBlockKeys: ["sel", "from-another-topic", "plain"] }),
    );
    expect(ctx.includedKeys).not.toContain("from-another-topic");
    // an FTS hit that does exist is allowed in
    expect(ctx.includedKeys).toContain("plain");
    for (const b of ctx.blocks)
      expect(base().allBlocks.map((x) => x.stableKey)).toContain(b.stableKey);
  });

  it("caps history to the last N messages", () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `m${i}`,
    }));
    const ctx = buildTutorContext(base({ history, maxHistory: 8 }));
    expect(ctx.history).toHaveLength(8);
    expect(ctx.history[0].content).toBe("m17");
    expect(ctx.history.at(-1)?.content).toBe("m24");
  });

  it("excludes notes unless includeMyNotes is set, and caps them when set", () => {
    const notes = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"];
    expect(buildTutorContext(base({ notes })).notes).toEqual([]);
    const on = buildTutorContext(
      base({ notes, includeMyNotes: true, maxNotes: 3 }),
    );
    expect(on.notes).toEqual(["n1", "n2", "n3"]);
  });

  it("clips an over-long note to the per-note cap", () => {
    const ctx = buildTutorContext(
      base({
        notes: ["z".repeat(5000)],
        includeMyNotes: true,
        noteCharCap: 100,
      }),
    );
    expect(ctx.notes[0]).toHaveLength(100);
  });

  it("drops low-priority blocks over the character budget but keeps the selected one", () => {
    const big = (k: string, pos: number) =>
      block(k, "concept", "y".repeat(4000), pos);
    const ctx = buildTutorContext(
      base({
        selectedBlockKey: "sel",
        allBlocks: [
          big("sel", 10),
          big("form", 20),
          big("a", 30),
          big("b", 40),
        ],
        ftsBlockKeys: ["a", "b"],
        charBudget: 5000,
      }),
    );
    expect(ctx.includedKeys).toContain("sel");
    expect(ctx.droppedForBudget.length).toBeGreaterThan(0);
    const used = ctx.blocks.reduce((n, b) => n + b.bodyMarkdown.length, 0);
    expect(used).toBeLessThanOrEqual(4000 + 4000); // selected + at most one more
  });

  it("returns blocks in reading order", () => {
    const ctx = buildTutorContext(
      base({ ftsBlockKeys: ["plain", "intro"], selectedBlockKey: "sum" }),
    );
    const positions = ctx.blocks.map(
      (b) =>
        base().allBlocks.find((x) => x.stableKey === b.stableKey)!.position,
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
