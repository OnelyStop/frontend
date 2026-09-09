import type { CardTone } from "@/design-system";

/** Our own benchmarks, not a board's published cutoff: the seconds a question is budgeted at, and the accuracy a section is judged against. */
export const PACE_TARGET = 45;
export const ACC_LINE = 70;

type Verdict = {
  target: number | null;
  score: number;
  sections: readonly { cleared: boolean }[];
};

/** The fill on the result card. A paper is cleared section by section, so clearing the total is not the same fact as clearing the paper. */
export function verdictTone(r: Verdict): CardTone {
  if (r.target === null) return "info";
  if (r.score < r.target) return "bad";
  // Amber is the case the total hides: the marks are there, but a section came up short.
  return r.sections.every((s) => s.cleared) ? "ok" : "warn";
}
