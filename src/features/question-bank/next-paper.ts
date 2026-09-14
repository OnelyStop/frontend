import type { Mock } from "./types";

export function nextPaper(papers: Mock[]): Mock | null {
  const paused = papers.find((p) => p.inProgress);
  if (paused) return paused;
  const sat = papers.filter((p) => p.score !== null);
  if (sat.length) return [...sat].sort((a, b) => b.score! - a.score!)[0]!;
  return papers[0] ?? null;
}

export function paperTitle(p: Mock): string {
  const head = p.year ? `${p.name} ${p.year}` : p.name;
  return [head, p.stage, p.sitting].filter(Boolean).join(" · ");
}

/** The exam name as a URL segment — "IBPS RRB-Clerk" becomes "ibps-rrb-clerk". */
export function examSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
