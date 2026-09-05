import { describe, expect, it } from "vitest";
import { classifyRelevance } from "./prefilter";

describe("classifyRelevance", () => {
  it("never drops a regulator's own feed item", () => {
    expect(
      classifyRelevance({
        source: "rbi_rss",
        title: "Billboard hoarding",
        summary: "",
      }).drop,
    ).toBe(false);
  });

  it("drops a NewsData item that hits only noise terms", () => {
    expect(
      classifyRelevance({
        source: "newsdata_io",
        title: "Pothole on MG Road swallows scooter",
        summary: "",
      }).drop,
    ).toBe(true);
  });

  it("keeps a noise term when a signal term is present", () => {
    expect(
      classifyRelevance({
        source: "newsdata_io",
        title: "RBI fines bank over billboard advertising",
        summary: "",
      }).drop,
    ).toBe(false);
  });

  it("leaves an item with neither for the model to judge", () => {
    expect(
      classifyRelevance({
        source: "newsdata_io",
        title: "Parliament passes the bill",
        summary: "",
      }).drop,
    ).toBe(false);
  });
});
