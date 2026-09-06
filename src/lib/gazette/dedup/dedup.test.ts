import { describe, expect, it } from "vitest";
import type { RawArticle } from "@/lib/gazette/types";
import { contentHash } from "./contentHash";
import { Deduplicator } from "./deduplicator";
import { normalizeText } from "./normalize";
import { extractSalientTokens, sameEvent } from "./salientFacts";

const at = new Date("2026-09-05T10:00:00+05:30");
const raw = (over: Partial<RawArticle>): RawArticle => ({
  source: "newsdata_io",
  title: "",
  summary: "",
  url: "https://example.com/a",
  publishedAt: at,
  scope: "national",
  ...over,
});

describe("normalizeText", () => {
  it("strips wire-copy boilerplate so it cannot defeat the exact-match gate", () => {
    expect(
      normalizeText(
        "RBI holds repo rate at 6.5%. Also read: markets rally https://x.y/z",
      ),
    ).toBe("rbi holds repo rate at 6.5%.");
  });
});

describe("contentHash", () => {
  it("is the same for the same story with different boilerplate", () => {
    const a = contentHash("RBI holds rate", "at 6.5%. Click here to subscribe");
    const b = contentHash("RBI holds rate", "at 6.5%. Follow us on X");
    expect(a).toBe(b);
  });

  it("differs when a number differs", () => {
    expect(contentHash("RBI holds rate", "at 6.5%")).not.toBe(
      contentHash("RBI holds rate", "at 6.25%"),
    );
  });
});

describe("extractSalientTokens", () => {
  it("keeps numbers with units and drops bare years", () => {
    const t = extractSalientTokens("Budget 2026 allocates 1,200 crore", "");
    expect(t.numbers.has("1200crore")).toBe(true);
    expect(t.numbers.has("2026")).toBe(false);
  });

  it("canonicalises a full name to its acronym", () => {
    const t = extractSalientTokens("Reserve Bank of India cuts rate", "");
    expect(t.entities.has("rbi")).toBe(true);
  });

  it("normalises percent spellings to one token", () => {
    expect(extractSalientTokens("rate at 6.50 per cent", "").numbers).toEqual(
      extractSalientTokens("rate at 6.5%", "").numbers,
    );
  });
});

describe("sameEvent", () => {
  const rbi65 = extractSalientTokens("RBI keeps repo rate at 6.5%", "");

  it("needs two shared tokens, one of them a number", () => {
    expect(sameEvent(rbi65, rbi65)).toBe(true);
  });

  it("does not match on a shared entity alone", () => {
    const other = extractSalientTokens("RBI and SEBI sign an MoU", "");
    expect(sameEvent(rbi65, other)).toBe(false);
  });
});

describe("Deduplicator", () => {
  const prior = raw({
    title: "RBI keeps repo rate at 6.5%",
    summary: "The MPC left the policy rate unchanged.",
  });
  const dedup = () =>
    new Deduplicator([
      {
        contentHash: contentHash(prior.title, prior.summary),
        title: prior.title,
        summary: prior.summary,
        scope: prior.scope,
        publishedAt: prior.publishedAt,
      },
    ]);

  it("catches a re-fetched wire copy at stage 1", () => {
    expect(dedup().check(prior)).toEqual({ verdict: "duplicate", stage: 1 });
  });

  it("catches an editorial paraphrase at stage 3", () => {
    const paraphrase = raw({
      title: "Reserve Bank of India holds policy rate at 6.5 per cent",
      summary: "No change from the central bank this quarter.",
    });
    expect(dedup().check(paraphrase)).toEqual({
      verdict: "duplicate",
      stage: 3,
    });
  });

  it("only matches paraphrases on the same IST day and scope", () => {
    const nextDay = raw({
      title: "Reserve Bank of India holds policy rate at 6.5 per cent",
      publishedAt: new Date("2026-09-06T10:00:00+05:30"),
    });
    expect(dedup().check(nextDay).verdict).toBe("new");

    const world = raw({
      title: "Reserve Bank of India holds policy rate at 6.5 per cent",
      scope: "international",
    });
    expect(dedup().check(world).verdict).toBe("new");
  });

  it("dedupes later candidates in the same batch against a registered one", () => {
    const d = dedup();
    const fresh = raw({ title: "SEBI fines broker 25 crore" });
    expect(d.check(fresh).verdict).toBe("new");
    d.register(fresh);
    expect(d.check(fresh).stage).toBe(1);
  });
});
