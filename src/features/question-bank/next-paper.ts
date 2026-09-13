import type { Mock } from "./types";

/** The paper to put on the plan: one already paused, else the best one you have sat, else the first you have not. */
export function nextPaper(papers: Mock[]): Mock | null {
  const paused = papers.find((p) => p.inProgress);
  if (paused) return paused;
  const sat = papers.filter((p) => p.score !== null);
  if (sat.length) return [...sat].sort((a, b) => b.score! - a.score!)[0]!;
  return papers[0] ?? null;
}

export function paperTitle(p: Mock): string {
  const head = p.year ? `${p.name} ${p.year}` : p.name;
  // The sitting is what separates two shifts of one exam; without it a board can show a dozen cards reading the same thing.
  return [head, p.stage, p.sitting].filter(Boolean).join(" · ");
}
