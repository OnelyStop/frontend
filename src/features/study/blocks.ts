import type { BlockType } from "./types";

/* Presentation metadata per block type. The reader styles a warning differently
   from a definition; the tutor always includes definition, formula and summary
   blocks regardless of what the learner selected (spec §10.4). */

type BlockMeta = {
  label: string;
  /** design-system meaning colour, or null for plain prose. */
  tone: "neutral" | "brand" | "warn" | "ok";
  /** Pulled into tutor context even when not the selected block. */
  alwaysInContext: boolean;
};

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  introduction: {
    label: "Introduction",
    tone: "neutral",
    alwaysInContext: false,
  },
  objectives: { label: "Objectives", tone: "neutral", alwaysInContext: false },
  concept: { label: "Concept", tone: "neutral", alwaysInContext: false },
  definition: { label: "Definition", tone: "brand", alwaysInContext: true },
  formula: { label: "Formula", tone: "brand", alwaysInContext: true },
  method: { label: "Method", tone: "neutral", alwaysInContext: false },
  worked_example: {
    label: "Worked example",
    tone: "neutral",
    alwaysInContext: false,
  },
  comparison: { label: "Comparison", tone: "neutral", alwaysInContext: false },
  shortcut: { label: "Shortcut", tone: "ok", alwaysInContext: false },
  warning: { label: "Common mistake", tone: "warn", alwaysInContext: false },
  exam_tip: { label: "Exam tip", tone: "brand", alwaysInContext: false },
  summary: { label: "Quick revision", tone: "neutral", alwaysInContext: true },
  practice: { label: "Practice", tone: "neutral", alwaysInContext: false },
};

export function blockMeta(type: string): BlockMeta {
  return (
    BLOCK_META[type as BlockType] ?? {
      label: type,
      tone: "neutral",
      alwaysInContext: false,
    }
  );
}
