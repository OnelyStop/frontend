import type { BlockType } from "./types";

type BlockMeta = {
  label: string;
  tone: "neutral" | "brand" | "warn" | "ok";
};

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  introduction: { label: "Introduction", tone: "neutral" },
  objectives: { label: "Objectives", tone: "neutral" },
  concept: { label: "Concept", tone: "neutral" },
  definition: { label: "Definition", tone: "brand" },
  formula: { label: "Formula", tone: "brand" },
  method: { label: "Method", tone: "neutral" },
  worked_example: { label: "Worked example", tone: "neutral" },
  comparison: { label: "Comparison", tone: "neutral" },
  shortcut: { label: "Shortcut", tone: "ok" },
  warning: { label: "Common mistake", tone: "warn" },
  exam_tip: { label: "Exam tip", tone: "brand" },
  summary: { label: "Quick revision", tone: "neutral" },
  practice: { label: "Practice", tone: "neutral" },
};

export function blockMeta(type: string): BlockMeta {
  return BLOCK_META[type as BlockType] ?? { label: type, tone: "neutral" };
}
