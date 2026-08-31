import { describe, expect, it } from "vitest";

import { contentHash, directionsOf, examKey, isActive, type RawQuestion } from "./import-rules";

describe("contentHash", () => {
  // Cross-checked against the real Python function this ports:
  //   python -c "import sys,json;sys.path.insert(0,'pipeline/6-generate');
  //   import generate;p=json.load(open('data/batch1/1.json'));
  //   print(generate.content_key(p['questions'][0]))"
  // on OnelyStop/question-bank's classified data. If this drifts, the port
  // has drifted from generate.py, not the other way round.
  it("matches generate.py's content_key for a real question", () => {
    const q: RawQuestion = {
      q_id: "ibps_clerk_2020_prelims_f1a8daa3::q001",
      paper_id: "ibps_clerk_2020_prelims_f1a8daa3",
      q_num: 1,
      stem: "According to the passage, which among the following statements is true?",
      options: {
        a: "Sleep allows us to enhance our ability of acquiring knowledge and process emotional experiences.",
        b: "An adult can function properly only with a quality sleep of 5-6 hours a day.",
        c: "Sleep deprivation can be cured only with a help of a medical professional.",
        d: "Both",
      },
    };
    expect(contentHash(q)).toBe("bedf402cf0e7a161");
  });

  it("is stable across option key order", () => {
    const stem = "Two plus two equals?";
    const a: RawQuestion = {
      q_id: "x::q1",
      paper_id: "x",
      q_num: 1,
      stem,
      options: { a: "3", b: "4", c: "5", d: "6" },
    };
    const b: RawQuestion = {
      q_id: "x::q1",
      paper_id: "x",
      q_num: 1,
      stem,
      options: { d: "6", c: "5", b: "4", a: "3" },
    };
    expect(contentHash(a)).toBe(contentHash(b));
  });

  // The whole reason exact-match is used instead of fuzzy dedup: two
  // questions that agree on every word but a number are different questions.
  it("treats questions differing only in numbers as different", () => {
    const base: RawQuestion = {
      q_id: "x::q1",
      paper_id: "x",
      q_num: 1,
      stem: "A train travels 60 km in 2 hours. Find its speed.",
      options: { a: "20", b: "25", c: "30", d: "35" },
    };
    const changed: RawQuestion = { ...base, stem: base.stem!.replace("60", "80") };
    expect(contentHash(base)).not.toBe(contentHash(changed));
  });

  it("passes through an existing content_hash unchanged", () => {
    const q: RawQuestion = {
      q_id: "x::q1",
      paper_id: "x",
      q_num: 1,
      content_hash: "deadbeefcafef00d",
    };
    expect(contentHash(q)).toBe("deadbeefcafef00d");
  });
});

describe("isActive", () => {
  const base: RawQuestion = {
    q_id: "x::q1",
    paper_id: "x",
    q_num: 1,
    stem: "Some question?",
    options: { a: "1", b: "2", c: "3", d: "4" },
  };

  it("is active when stem and >=4 options exist", () => {
    expect(isActive(base)).toBe(true);
  });

  it("is inactive with no stem", () => {
    expect(isActive({ ...base, stem: "" })).toBe(false);
    expect(isActive({ ...base, stem: "   " })).toBe(false);
    expect(isActive({ ...base, stem: null })).toBe(false);
  });

  it("is inactive with fewer than 4 options", () => {
    expect(isActive({ ...base, options: { a: "1", b: "2", c: "3" } })).toBe(false);
  });

  it("is inactive when a needed figure was never extracted", () => {
    expect(isActive({ ...base, has_image: true, image_refs: [] })).toBe(false);
    expect(isActive({ ...base, direction_has_image: true, direction_image_refs: [] })).toBe(false);
  });

  it("is active when the needed figure IS present", () => {
    expect(isActive({ ...base, has_image: true, image_refs: ["fig1.png"] })).toBe(true);
  });

  it("respects an explicit is_active: false", () => {
    expect(isActive({ ...base, is_active: false })).toBe(false);
  });

  // Deliberately not ported from filter_pool: an unlabelled question is still
  // browsable in the question bank, unlike in a specific generated mock.
  it("does not require section or topic to be active", () => {
    expect(isActive({ ...base, section: null, topic: null })).toBe(true);
  });
});

describe("examKey", () => {
  it("joins the five identity fields, lowercased", () => {
    expect(
      examKey({
        paper_id: "p1",
        bank: "SBI",
        role: "PO",
        exam_type: "Prelims",
        year: 2024,
        shift: null,
        questions: [],
      }),
    ).toBe("sbi|po|prelims|2024|unknown");
  });
});

describe("directionsOf", () => {
  it("keeps one row per distinct direction id, first non-empty body wins", () => {
    const rows = directionsOf({
      paper_id: "p1",
      questions: [
        { q_id: "p1::q1", paper_id: "p1", q_num: 1, direction_id: "d001", direction_text: "Passage A" },
        { q_id: "p1::q2", paper_id: "p1", q_num: 2, direction_id: "d001", direction_text: "Passage A" },
        { q_id: "p1::q3", paper_id: "p1", q_num: 3, direction_id: "d002", direction_text: "Passage B" },
        { q_id: "p1::q4", paper_id: "p1", q_num: 4 },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.directionId === "d001")?.body).toBe("Passage A");
    expect(rows.find((r) => r.directionId === "d002")?.body).toBe("Passage B");
  });
});
