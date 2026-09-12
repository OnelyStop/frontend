export type AttemptMode = "bank" | "mix" | "paper";

/** One question inside a finished attempt; `chosen === null` is a blank, not a wrong answer. */
export type ScoredQuestion = {
  qId: string;
  qNum: number | null;
  /** A question-bank section label — see SECTION_FROM_DB in data/navigation.ts. */
  section: string;
  topic: string | null;
  stem: string;
  direction: string | null;
  options: { key: string; text: string }[];
  chosen: string | null;
  correct: string;
  isCorrect: boolean;
  explanation: string | null;
  timeMs: number | null;
  marks: number;
  negativeMarks: number;
  noteId: string | null;
  noteTitle: string | null;
  noteSummary: string | null;
};

export type SectionResult = {
  section: string;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  marksEarned: number;
  marksLost: number;
  /** Earned minus lost — what the sectional target is compared against. */
  net: number;
  /** 55% of the section's questions, on the same basis as the paper's target; null off a real paper. */
  target: number | null;
  cleared: boolean;
};

export type TopicResult = {
  section: string;
  topic: string;
  attempted: number;
  correct: number;
  accuracy: number;
  avgTimeSec: number;
  /** Marks forgone on wrong answers on this topic plus their negative-marking penalty. */
  marksLost: number;
};

export type TopicTheory = {
  topic: string;
  topicTitle: string;
  section: string;
  summary: string;
  tricks: { name: string; description: string }[];
  commonMistakes: string[];
  subtopics: { noteId: string; title: string }[];
};

export type TimelinePoint = {
  index: number;
  elapsedSec: number;
  cumulativeScore: number;
};

export type Scorecard = {
  attemptId: number;
  mode: AttemptMode;
  paperName: string | null;
  startedAt: string;
  submittedAt: string | null;
  durationSec: number | null;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  maxScore: number;
  /** 55% of the paper's questions — our practice benchmark, never a board's published cutoff. */
  target: number | null;
  accuracy: number;
  sections: SectionResult[];
  topics: TopicResult[];
  theory: TopicTheory[];
  timeline: TimelinePoint[];
  questions: ScoredQuestion[];
};

/** What the client posts on submit — never a score, never `isCorrect`. */
export type SubmittedAnswer = {
  qId: string;
  chosen: string | null;
  timeMs: number | null;
};

/** Where a paused mock left off — `startMockAttempt` returns this instead of a fresh attempt when one is already open. */
export type ResumeState = {
  answers: Record<string, { chosen: string | null; timeMs: number }>;
  currentSection: string | null;
  lockedSections: string[];
  sectionRemainingMs: number | null;
  examMode: boolean;
  flagCount: number;
};
