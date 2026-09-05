import { blockMeta } from "./blocks";

/* Builds the bounded context the tutor is allowed to see (spec §10).
 *
 * The hard guarantee lives here: the only blocks that can ever reach the model
 * are ones passed in `allBlocks` — a single topic version, fetched by the
 * caller. Within that, only the selected block, the always-in-context types
 * (definition / formula / summary) and the full-text-search hits are included,
 * capped by a character budget. There is no path by which a sibling topic, a
 * chapter or a whole subject enters the prompt.
 *
 * Pure and DB-free so src/features/study/context.test.ts can pin the boundary.
 */

export type ContextInput = {
  topic: { title: string; summary: string; learningObjectives: string[] };
  selectedBlockKey: string | null;
  allBlocks: {
    stableKey: string;
    type: string;
    title: string;
    bodyMarkdown: string;
    position: number;
  }[];
  /** Block keys returned by Postgres FTS, most relevant first. */
  ftsBlockKeys: string[];
  history: { role: "user" | "assistant"; content: string }[];
  /** Owner-scoped by the caller. Ignored unless includeMyNotes. */
  notes: string[];
  includeMyNotes: boolean;
  /** Character ceiling for the serialized block bodies. */
  charBudget?: number;
  maxHistory?: number;
  maxNotes?: number;
  noteCharCap?: number;
  historyCharCap?: number;
};

export type BuiltContext = {
  blocks: {
    stableKey: string;
    type: string;
    title: string;
    bodyMarkdown: string;
  }[];
  history: { role: "user" | "assistant"; content: string }[];
  notes: string[];
  includedKeys: string[];
  droppedForBudget: string[];
};

const DEFAULTS = {
  charBudget: 12_000,
  maxHistory: 10,
  maxNotes: 5,
  noteCharCap: 1_200,
  historyCharCap: 2_000,
};

export function buildTutorContext(input: ContextInput): BuiltContext {
  const cfg = { ...DEFAULTS, ...input };
  const byKey = new Map(input.allBlocks.map((b) => [b.stableKey, b]));

  // Priority tiers. Lower number = kept first when the budget bites.
  const priority = new Map<string, number>();
  const consider = (key: string, tier: number) => {
    if (!byKey.has(key)) return; // never invent a block
    priority.set(key, Math.min(priority.get(key) ?? Infinity, tier));
  };

  if (input.selectedBlockKey) consider(input.selectedBlockKey, 0);
  for (const b of input.allBlocks) {
    if (blockMeta(b.type).alwaysInContext) consider(b.stableKey, 1);
  }
  input.ftsBlockKeys.forEach((key, i) => consider(key, 2 + i));

  const ordered = [...priority.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => byKey.get(key)!);

  const kept: typeof ordered = [];
  const dropped: string[] = [];
  let used = 0;
  for (const b of ordered) {
    const cost = b.bodyMarkdown.length + b.title.length + 40;
    // The selected block always goes in, even if it alone exceeds the budget.
    if (kept.length > 0 && used + cost > cfg.charBudget) {
      dropped.push(b.stableKey);
      continue;
    }
    kept.push(b);
    used += cost;
  }

  kept.sort((a, b) => a.position - b.position);

  const history = input.history.slice(-cfg.maxHistory).map((m) => ({
    role: m.role,
    content: m.content.slice(0, cfg.historyCharCap),
  }));

  const notes = input.includeMyNotes
    ? input.notes.slice(0, cfg.maxNotes).map((n) => n.slice(0, cfg.noteCharCap))
    : [];

  return {
    blocks: kept.map(({ stableKey, type, title, bodyMarkdown }) => ({
      stableKey,
      type,
      title,
      bodyMarkdown,
    })),
    history,
    notes,
    includedKeys: kept.map((b) => b.stableKey),
    droppedForBudget: dropped,
  };
}
