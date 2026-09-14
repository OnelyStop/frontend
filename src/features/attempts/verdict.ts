import type { PillTone } from "@/design-system";

/** Our own benchmarks, not a board's published cutoff: the seconds a question is budgeted at, and the accuracy a section is judged against. */
export const PACE_TARGET = 45;
export const ACC_LINE = 70;

type Verdict = {
  target: number | null;
  score: number;
  sections: readonly { cleared: boolean }[];
};

export function verdictTone(r: Verdict): PillTone {
  if (r.target === null) return "info";
  if (r.score < r.target) return "bad";
  return r.sections.every((s) => s.cleared) ? "ok" : "warn";
}

export function verdictLabel(r: Verdict): string {
  if (r.target === null) return "No target";
  if (r.score < r.target) return "Under the target";
  return r.sections.every((s) => s.cleared) ? "Cleared" : "Short in a section";
}
