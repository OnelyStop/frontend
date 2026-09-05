import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evalArithmetic,
  schemaErrors,
  validateTopic,
} from "../../../scripts/study-validate.mjs";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const schema = JSON.parse(
  readFileSync(join(ROOT, "schemas/study-topic.schema.json"), "utf8"),
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "content/source-registry.json"), "utf8"),
);

function goodTopic() {
  return JSON.parse(
    readFileSync(
      join(
        ROOT,
        "content/quantitative-aptitude/arithmetic/percentages.topic.json",
      ),
      "utf8",
    ),
  );
}

const run = (t: unknown) =>
  validateTopic(t, { schema, registry, corpusTopicSlugs: new Set() });

describe("study content validator", () => {
  it("passes the real percentages topic (premise check)", () => {
    expect(run(goodTopic()).errors).toEqual([]);
  });

  it("flags a factual block with no usable source", () => {
    const t = goodTopic();
    t.blocks[2].sourceIds = [];
    expect(run(t).errors.join("\n")).toMatch(/no usable allowlisted source/);
  });

  it("flags a duplicate block stable key", () => {
    const t = goodTopic();
    t.blocks[1].id = t.blocks[0].id;
    expect(run(t).errors.join("\n")).toMatch(/duplicate id/);
  });

  it("flags block positions that are not strictly increasing", () => {
    const t = goodTopic();
    t.blocks[3].position = t.blocks[2].position;
    expect(run(t).errors.join("\n")).toMatch(/not strictly after/);
  });

  it("flags a flashcard pointing at a block that does not exist", () => {
    const t = goodTopic();
    t.flashcards[0].sourceBlockIds = ["no-such-block"];
    expect(run(t).errors.join("\n")).toMatch(/not a block in this topic/);
  });

  it("flags a banned domain in a source URL", () => {
    const t = goodTopic();
    t.sources[0].url = "https://byjus.com/maths/percentage/";
    expect(run(t).errors.join("\n")).toMatch(/banned domain/);
  });

  it("flags raw HTML / script in block markdown", () => {
    const t = goodTopic();
    t.blocks[0].markdown += "\n<script>alert(1)</script>";
    expect(run(t).errors.join("\n")).toMatch(/<script/);
  });

  it("flags an unsourced 'previous year' provenance claim", () => {
    const t = goodTopic();
    t.blocks[0].markdown += "\nThis was asked in a previous year paper.";
    expect(run(t).errors.join("\n")).toMatch(/exam-provenance claim/);
  });

  it("flags a quantitative worked example whose declared answer is wrong", () => {
    const t = goodTopic();
    const we = t.blocks.find(
      (b: { type: string }) => b.type === "worked_example",
    );
    we.expectedAnswers[0].value = we.expectedAnswers[0].value + 1;
    expect(run(t).errors.join("\n")).toMatch(/expression gives/);
  });

  it("flags a worked example with no way to recompute", () => {
    const t = goodTopic();
    const we = t.blocks.find(
      (b: { type: string }) => b.type === "worked_example",
    );
    delete we.expectedAnswers;
    expect(run(t).errors.join("\n")).toMatch(/no expectedAnswers to recompute/);
  });

  it("rejects an unknown top-level property via the schema", () => {
    const t = goodTopic();
    t.somethingExtra = true;
    expect(run(t).errors.join("\n")).toMatch(
      /unknown property "somethingExtra"/,
    );
  });
});

describe("schemaErrors", () => {
  it("checks required, enum and pattern", () => {
    const s = {
      type: "object",
      additionalProperties: false,
      required: ["slug", "kind"],
      properties: {
        slug: { type: "string", pattern: "^[a-z-]+$" },
        kind: { enum: ["a", "b"] },
      },
    };
    expect(schemaErrors(s, { slug: "ok", kind: "a" })).toEqual([]);
    expect(schemaErrors(s, { slug: "Bad_Slug", kind: "c" }).length).toBe(2);
    expect(schemaErrors(s, {}).length).toBe(2);
  });
});

describe("evalArithmetic", () => {
  it("evaluates a restricted expression", () => {
    expect(evalArithmetic("850 * (1 - 0.32)")).toBeCloseTo(578);
    expect(evalArithmetic("((1.2 * 0.85) - 1) * 100")).toBeCloseTo(2);
  });
  it("rejects anything that is not arithmetic", () => {
    expect(() => evalArithmetic("process.exit(1)")).toThrow();
    expect(() => evalArithmetic("globalThis")).toThrow();
  });
});
