import type { Mock } from "./types";

/** The paper to put on the plan: the best one you have sat, else the first you have not. */
export function nextPaper(papers: Mock[]): Mock | null {
  const sat = papers.filter((p) => p.score !== null);
  if (sat.length) return [...sat].sort((a, b) => b.score! - a.score!)[0]!;
  return papers[0] ?? null;
}

export function paperTitle(p: Mock): string {
  return p.year ? `${p.name} ${p.year} · ${p.stage}` : `${p.name} · ${p.stage}`;
}
