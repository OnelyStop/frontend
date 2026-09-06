/** Shapes shared between the server query modules and the client views —
 * plain data, no `server-only`, so a client view can import the type. */

export type AttemptMode = "bank" | "mix" | "paper";

/** One answered (or skipped) question inside a finished attempt, joined
 * against its own correct answer and — when the topic maps to one — its
 * theory note. `chosen === null` means left blank, not wrong. */
export type ScoredQuestion = {
  qId: string;
  qNum: number | null;
  /** One of the question bank's own section labels (Quantitative, Reasoning,
   * English, GA, Computer) — see SECTION_FROM_DB in data/navigation.ts. */
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
  /** The topic's theory note, when `(section, topic)` maps to one — see
   * attempts.server.ts's `getScorecard` for the join. Null for the ~13% of
   * questions with no topic classification. */
  noteId: string | null;
  noteTitle: string | null;
  /** The topic's one-sentence summary, shown inline in the per-question
   * theory block so the reader gets real value before deciding to navigate
   * away to the full note. */
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
};

export type TopicResult = {
  section: string;
  topic: string;
  attempted: number;
  correct: number;
  accuracy: number;
  avgTimeSec: number;
  /** Marks given up to wrong answers on this topic, plus the negative-marking
   * penalty on them — what "Revise these topics" ranks by. */
  marksLost: number;
};

/** Everything the "Revise these topics" section needs for one topic — a
 * summary and two theory blocks that are cheap to render (see attempts.server.ts's
 * measured content-size notes), plus every subtopic under it so the reader
 * can pick the one that actually matches the question, rather than the
 * scorecard silently guessing one. */
export type TopicTheory = {
  topic: string;
  topicTitle: string;
  section: string;
  summary: string;
  tricks: { name: string; description: string }[];
  commonMistakes: string[];
  subtopics: { noteId: string; title: string }[];
};

/** A point on the cumulative-score-over-time chart — one per answered
 * question, in the order it was answered. */
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
  /** Null when the paper (or drill section) has no known cutoff — a `bank`
   * or `mix` drill never does. */
  cutoff: number | null;
  accuracy: number;
  sections: SectionResult[];
  topics: TopicResult[];
  /** Worst topics by marks lost, with theory to revise them — empty for a
   * perfect score, and for a topic with no note (~13% of questions have no
   * topic classification at all). */
  theory: TopicTheory[];
  timeline: TimelinePoint[];
  questions: ScoredQuestion[];
};

/** What the client posts on submit — never a score, never `isCorrect`.
 * Grading happens once, server-side, in attempts.server.ts. */
export type SubmittedAnswer = {
  qId: string;
  chosen: string | null;
  timeMs: number | null;
};
