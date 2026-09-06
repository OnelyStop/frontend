import { describe, expect, it } from "vitest";

import {
  DESCRIPTIVE_RESPONSE_JSON_SCHEMA,
  BANDS,
} from "@/lib/prompts/descriptive";
import { MarkingResponse, toMarking } from "./marking";
import { TASKS, taskById, wordCount } from "./tasks";

const reply = (scores: Partial<Record<string, number>> = {}) => ({
  bands: BANDS.map((b) => ({
    id: b.id,
    score: scores[b.id] ?? 50,
    comment: `on ${b.id}`,
  })),
  strengths: ["clear opening"],
  fixes: [{ quote: null, problem: "too short", rewrite: "add a paragraph" }],
  verdict: "pass standard",
});

describe("marking arithmetic", () => {
  it("splits the paper's marks across the bands with nothing left over", () => {
    for (const task of TASKS) {
      const m = toMarking(MarkingResponse.parse(reply()), task.marks);
      expect(m.outOf).toBe(task.marks);
      expect(m.bands.reduce((s, b) => s + b.outOf, 0)).toBe(task.marks);
    }
  });

  it("keeps a 15-mark split on the halves rather than rounding past the paper", () => {
    const m = toMarking(MarkingResponse.parse(reply()), 15);
    expect(m.bands.map((b) => b.outOf)).toEqual([5.5, 3, 4.5, 2]);
  });

  it("awards nothing at 0 and the whole band at 100", () => {
    const zero = toMarking(
      MarkingResponse.parse(
        reply({ content: 0, organisation: 0, language: 0, format: 0 }),
      ),
      10,
    );
    expect(zero.total).toBe(0);

    const full = toMarking(
      MarkingResponse.parse(
        reply({ content: 100, organisation: 100, language: 100, format: 100 }),
      ),
      10,
    );
    expect(full.total).toBe(10);
  });

  it("totals from the bands shown, so the parts add up to the whole", () => {
    const m = toMarking(MarkingResponse.parse(reply({ content: 80 })), 10);
    expect(m.total).toBe(m.bands.reduce((s, b) => s + b.awarded, 0));
  });

  it("cannot award more than the paper however the model scores", () => {
    // The model has no say in the arithmetic, so 100 everywhere is still the cap.
    const m = toMarking(
      MarkingResponse.parse(
        reply({ content: 100, organisation: 100, language: 100, format: 100 }),
      ),
      15,
    );
    expect(m.total).toBeLessThanOrEqual(15);
  });
});

describe("marking response validation", () => {
  it("rejects a score outside 0-100", () => {
    expect(() => MarkingResponse.parse(reply({ content: 140 }))).toThrow();
  });

  it("rejects a reply that scores one band twice and another not at all", () => {
    const bad = reply();
    bad.bands[1] = { ...bad.bands[0]! };
    expect(() => MarkingResponse.parse(bad)).toThrow();
  });

  it("accepts a fix with no quote, which is how a whole-script fault arrives", () => {
    const parsed = MarkingResponse.parse(reply());
    expect(toMarking(parsed, 10).fixes[0]!.quote).toBeNull();
  });
});

describe("the response schema strict mode accepts", () => {
  const schema = DESCRIPTIVE_RESPONSE_JSON_SCHEMA.schema;

  it("lists every property in required, or strict mode 400s the call", () => {
    expect([...schema.required].sort()).toEqual(
      Object.keys(schema.properties).sort(),
    );
  });

  it("lists every band property in required too", () => {
    const band = schema.properties.bands.items;
    expect([...band.required].sort()).toEqual(
      Object.keys(band.properties).sort(),
    );
  });

  it("makes the optional quote nullable rather than absent", () => {
    const fix = schema.properties.fixes.items;
    expect(fix.properties.quote.type).toEqual(["string", "null"]);
    expect([...fix.required].sort()).toEqual(
      Object.keys(fix.properties).sort(),
    );
  });

  it("offers the model exactly the bands the server weights", () => {
    expect([...schema.properties.bands.items.properties.id.enum]).toEqual(
      BANDS.map((b) => b.id),
    );
  });
});

describe("tasks", () => {
  it("looks a task up by id and refuses one the client invented", () => {
    expect(taskById("letter")?.kind).toBe("Letter");
    expect(taskById("../../etc/passwd")).toBeUndefined();
  });

  it("counts words the way the length band and the route both need", () => {
    expect(wordCount("  two   words \n")).toBe(2);
    expect(wordCount("   ")).toBe(0);
  });
});
