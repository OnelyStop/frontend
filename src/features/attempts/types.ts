export type AttemptMode = "bank" | "mix" | "paper";

/** One question inside a finished attempt; `chosen === null` is a blank, not a wrong answer. */
export type ScoredQuestion = {
  qId: string;
  qNum: number | null;
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
  net: number;
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

export type ResumeState = {
  answers: Record<string, { chosen: string | null; timeMs: number }>;
  currentSection: string | null;
  lockedSections: string[];
  sectionRemainingMs: number | null;
  examMode: boolean;
  flagCount: number;
};
