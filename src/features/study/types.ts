/* Shared shapes for the study module (knowledge base). The API returns these;
   the reader consumes them. Kept free of server imports so a client component
   can import the types without pulling the database in. */

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

export type NoteColor = "yellow" | "blue" | "green" | "pink";

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

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  citedBlockKeys: string[];
  createdAt: string;
};
