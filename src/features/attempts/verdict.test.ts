import { describe, expect, it } from "vitest";
import { verdictTone } from "./verdict";

/* The result card's colour is the first thing read after a sitting; these are the four things it may say. */
const sections = (...cleared: boolean[]) =>
  cleared.map((c) => ({ cleared: c }));

describe("what the result card says", () => {
  it("a drill has no target, so there is nothing to pass or fail", () => {
    expect(
      verdictTone({ target: null, score: 12, sections: sections(false) }),
    ).toBe("info");
  });

  it("green only when the total and every section are cleared", () => {
    expect(
      verdictTone({ target: 55, score: 61, sections: sections(true, true) }),
    ).toBe("ok");
  });

  // The bug this guards: branching on "a section is short" alone paints an 8/100 sitting amber.
  it("red when the total itself is short, however the sections fell", () => {
    expect(
      verdictTone({ target: 55, score: 8, sections: sections(false, false) }),
    ).toBe("bad");
  });

  it("amber for the case the total hides — enough marks, one section short", () => {
    expect(
      verdictTone({ target: 55, score: 61, sections: sections(true, false) }),
    ).toBe("warn");
  });

  it("all four verdicts are reachable, so no branch is dead", () => {
    const tones = [
      verdictTone({ target: null, score: 0, sections: [] }),
      verdictTone({ target: 55, score: 61, sections: sections(true) }),
      verdictTone({ target: 55, score: 61, sections: sections(false) }),
      verdictTone({ target: 55, score: 8, sections: sections(false) }),
    ];
    expect(new Set(tones).size).toBe(4);
  });

  it("meeting the target exactly is not short of it", () => {
    expect(
      verdictTone({ target: 55, score: 55, sections: sections(true) }),
    ).toBe("ok");
  });
});
