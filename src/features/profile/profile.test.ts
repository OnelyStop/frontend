import { describe, expect, it } from "vitest";
import { profiles } from "@/db/schema";
import { EXAMS, SECTIONS } from "@/data/navigation";
import { profileUpdate } from "./types";

/* The request validator builds its enums from the navigation constants so the
   client bundle stays free of drizzle. That leaves two lists to drift apart,
   and a drift is invisible until a save fails at the database rather than the
   validator — so assert they are the same list. */
describe("profile enums track the database", () => {
  it("exam boards match", () => {
    expect([...profiles.examBoard.enumValues]).toEqual([...EXAMS]);
  });

  it("sections match", () => {
    expect([...profiles.defaultSection.enumValues]).toEqual([...SECTIONS]);
  });
});

describe("profileUpdate", () => {
  it("rejects a field it does not own", () => {
    const result = profileUpdate.safeParse({ id: "someone-else" });
    expect(result.success).toBe(false);
  });

  it("rejects a target year outside the check constraint", () => {
    expect(profileUpdate.safeParse({ targetYear: 1999 }).success).toBe(false);
    expect(profileUpdate.safeParse({ targetYear: 2101 }).success).toBe(false);
    expect(profileUpdate.safeParse({ targetYear: 2026 }).success).toBe(true);
  });

  it("rejects an exam board that is not in the enum", () => {
    expect(profileUpdate.safeParse({ examBoard: "IBPS SO" }).success).toBe(
      false,
    );
  });

  it("accepts an empty patch so the route can reject it by name", () => {
    expect(profileUpdate.safeParse({}).success).toBe(true);
  });
});
