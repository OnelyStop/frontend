import Fuse from "fuse.js";
import { TARGETS, type Target } from "./targets";

const fuse = new Fuse(TARGETS, {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.42,
  minMatchCharLength: 2,
  keys: [
    { name: "label", weight: 0.55 },
    { name: "keys", weight: 0.35 },
    { name: "code", weight: 0.1 },
  ],
});

const byId = new Map(TARGETS.map((t) => [t.id, t]));

// Fuse scores one string at a time, so "p1 2023" would miss a haystack written
// "2023 p1". Searching per token and summing makes word order irrelevant while
// keeping the typo tolerance, which is the half students actually need.
function searchToken(token: string): Map<string, number> {
  const out = new Map<string, number>();

  if (token.length < 2) {
    for (const t of TARGETS) {
      const words = `${t.label} ${t.keys} ${t.code}`.toLowerCase().split(/\s+/);
      if (words.some((w) => w.startsWith(token))) out.set(t.id, 0.5);
    }
    return out;
  }

  for (const hit of fuse.search(token, { limit: 40 })) {
    out.set(hit.item.id, hit.score ?? 1);
  }
  return out;
}

export function rank(query: string): Target[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const score = new Map<string, number>();
  const hits = new Map<string, number>();

  for (const token of tokens) {
    for (const [id, s] of searchToken(token)) {
      score.set(id, (score.get(id) ?? 0) + s);
      hits.set(id, (hits.get(id) ?? 0) + 1);
    }
  }

  const ranked = [...hits.entries()].sort((a, b) => {
    // Every token matching beats a good score on only one of them.
    if (a[1] !== b[1]) return b[1] - a[1];
    return (score.get(a[0]) ?? 1) - (score.get(b[0]) ?? 1);
  });

  const full = ranked.filter(([, n]) => n === tokens.length);
  return (full.length ? full : ranked).slice(0, 7).map(([id]) => byId.get(id)!);
}
