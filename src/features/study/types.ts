import { z } from "zod";

// Free of server imports so client components can import these without the database.

export const NOTE_COLORS = ["yellow", "blue", "green", "pink"] as const;
const MAX_NOTE = 10_000;

export const noteCreate = z.object({
  bodyMarkdown: z.string().trim().min(1).max(MAX_NOTE),
  blockStableKey: z.string().max(200).nullish(),
  contentVersion: z.number().int().positive().nullish(),
  color: z.enum(NOTE_COLORS).optional(),
});

export const noteUpdate = z
  .object({
    bodyMarkdown: z.string().trim().min(1).max(MAX_NOTE).optional(),
    color: z.enum(NOTE_COLORS).optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .refine((v) => v.bodyMarkdown !== undefined || v.color !== undefined, {
    message: "nothing_to_update",
  });

export const progressUpdate = z.object({
  progressPercent: z.number().min(0).max(100),
});

export type BlockType =
  | "introduction"
  | "objectives"
  | "concept"
  | "definition"
  | "formula"
  | "method"
  | "worked_example"
  | "comparison"
  | "shortcut"
  | "warning"
  | "exam_tip"
  | "summary"
  | "practice";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type NoteColor = (typeof NOTE_COLORS)[number];

export type SubjectSummary = {
  slug: string;
  name: string;
  description: string | null;
  chapterCount: number;
  topicCount: number;
};

export type ChapterOutline = {
  slug: string;
  name: string;
  description: string | null;
  topics: TopicRef[];
};

export type TopicRef = {
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
};

export type ContentBlock = {
  stableKey: string;
  type: BlockType;
  title: string;
  bodyMarkdown: string;
  position: number;
  sourceKeys: string[];
};

export type SourceRef = {
  registryKey: string | null;
  url: string;
  title: string;
  publisher: string;
  usageMode: string;
  license: string | null;
  retrievedAt: string;
};

export type Flashcard = {
  stableKey: string;
  front: string;
  back: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  position: number;
};

export type TopicOutline = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  examTags: string[];
  learningObjectives: string[];
  contentVersion: number;
  lastReviewedAt: string | null;
  subject: { slug: string; name: string };
  chapter: { slug: string; name: string };
  blocks: ContentBlock[];
  sources: SourceRef[];
  prev: TopicRef | null;
  next: TopicRef | null;
};

export type StudyNote = {
  id: string;
  topicId: string;
  blockStableKey: string | null;
  bodyMarkdown: string;
  color: NoteColor;
  visibility: "private" | "unlisted" | "public";
  updatedAt: string;
};
