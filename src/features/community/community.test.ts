import { describe, expect, it } from "vitest";
import { doubts } from "@/db/schema";
import { SECTIONS } from "@/data/navigation";
import { decodeCursor, encodeCursor } from "./cursor";
import { doubtCreate, doubtQuery } from "./types";

describe("doubt section enum tracks the database", () => {
  it("matches the navigation list the validator is built from", () => {
    expect([...doubts.section.enumValues]).toEqual([...SECTIONS]);
  });
});

describe("feed cursor", () => {
  const id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

  it("round-trips a value and an id", () => {
    expect(decodeCursor(encodeCursor({ value: "42", id }))).toEqual({
      value: "42",
      id,
    });
  });

  it("round-trips a timestamp, which contains no separator", () => {
    const value = "2026-09-05T04:30:00.000Z";
    expect(decodeCursor(encodeCursor({ value, id }))).toEqual({ value, id });
  });

  it("drops a cursor whose id is not a uuid", () => {
    expect(decodeCursor(encodeCursor({ value: "1", id: "' or 1=1--" }))).toBe(
      null,
    );
  });

  it("drops garbage rather than throwing", () => {
    expect(decodeCursor("not-a-cursor")).toBe(null);
    expect(decodeCursor("")).toBe(null);
  });
});

describe("doubtQuery", () => {
  it("defaults to the most-stuck ordering", () => {
    const parsed = doubtQuery.parse({});
    expect(parsed.sort).toBe("stuck");
  });

  it("rejects a sort the query builder has no branch for", () => {
    expect(doubtQuery.safeParse({ sort: "trending" }).success).toBe(false);
  });

  it("rejects a section outside the enum", () => {
    expect(doubtQuery.safeParse({ section: "Banking" }).success).toBe(false);
  });
});

describe("doubtCreate", () => {
  const valid = {
    section: "Quantitative Aptitude",
    topic: "Caselet DI",
    title: "Caselet DI is eating four minutes before I know if it is doable",
    body: "By the time I have drawn the grid a third of my quant time is gone. Is there a tell in the first two lines?",
  };

  it("accepts a complete doubt", () => {
    expect(doubtCreate.safeParse(valid).success).toBe(true);
  });

  /* The lengths mirror the check constraints on the table. If they drift, the
     insert fails in Postgres instead of at the validator, which surfaces to the
     user as a 500 rather than a 400. */
  it("rejects a title shorter than the check constraint allows", () => {
    expect(
      doubtCreate.safeParse({ ...valid, title: "too short" }).success,
    ).toBe(false);
  });

  it("rejects a body longer than the check constraint allows", () => {
    expect(
      doubtCreate.safeParse({ ...valid, body: "x".repeat(4001) }).success,
    ).toBe(false);
  });

  it("rejects a missing topic, which is what makes a doubt findable", () => {
    expect(doubtCreate.safeParse({ ...valid, topic: "" }).success).toBe(false);
  });
});
