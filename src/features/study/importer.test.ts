import { describe, expect, it } from "vitest";
import { sourceHashOf, titleCaseFromSlug } from "../../../scripts/study-import";

/* The importer is idempotent because a content version carries a hash of its
   content. These pin what that hash does and does not depend on, so a re-import
   of an unchanged file stays a no-op and an edited file is detected. */

const topic = () => ({
  subjectSlug: "quantitative-aptitude",
  topicSlug: "percentages",
  title: "Percentages",
  summary: "s",
  difficulty: "beginner",
  estimatedMinutes: 25,
  examTags: ["ibps-po"],
  prerequisiteTopicSlugs: [],
  learningObjectives: ["a", "b", "c"],
  tags: ["x"],
  contentStatus: "draft",
  contentVersion: 1,
  topicPosition: 10,
  reviewCadenceDays: 365,
  sources: [
    {
      sourceId: "WIKIBOOKS_MATH",
      url: "https://en.wikibooks.org/wiki/x",
      title: "x",
      publisher: "Wikibooks contributors",
      usageMode: "open_adaptable",
      retrievedAt: "2026-09-01T00:00:00Z",
    },
  ],
  blocks: [
    {
      id: "a",
      type: "concept",
      title: "A",
      markdown: "alpha",
      position: 20,
      sourceIds: ["WIKIBOOKS_MATH"],
    },
    { id: "b", type: "summary", title: "B", markdown: "beta", position: 10 },
  ],
  flashcards: [
    {
      id: "c1",
      front: "f",
      back: "b",
      difficulty: "easy",
      sourceBlockIds: ["a"],
      position: 10,
    },
  ],
});

describe("sourceHashOf", () => {
  it("is independent of block and flashcard array order in the file", () => {
    const a = topic();
    const b = {
      ...topic(),
      blocks: [...topic().blocks].reverse(),
      flashcards: [...topic().flashcards].reverse(),
    };
    expect(sourceHashOf(a)).toBe(sourceHashOf(b));
  });

  it("changes when a block body changes", () => {
    const a = topic();
    const b = topic();
    b.blocks[0].markdown = "alpha!";
    expect(sourceHashOf(a)).not.toBe(sourceHashOf(b));
  });

  it("changes when a flashcard's answer changes", () => {
    const a = topic();
    const b = topic();
    b.flashcards[0].back = "different";
    expect(sourceHashOf(a)).not.toBe(sourceHashOf(b));
  });

  it("ignores display-only fields (topicPosition, contentStatus)", () => {
    const a = topic();
    const b = topic();
    b.topicPosition = 999;
    b.contentStatus = "published";
    expect(sourceHashOf(a)).toBe(sourceHashOf(b));
  });

  it("reacts to a change in the declared review cadence", () => {
    const a = topic();
    const b = topic();
    b.reviewCadenceDays = 90;
    expect(sourceHashOf(a)).not.toBe(sourceHashOf(b));
  });
});

describe("titleCaseFromSlug", () => {
  it("turns a slug into a heading", () => {
    expect(titleCaseFromSlug("quantitative-aptitude")).toBe(
      "Quantitative Aptitude",
    );
    expect(titleCaseFromSlug("rbi")).toBe("Rbi");
  });
});
