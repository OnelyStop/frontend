/** Shapes shared between the server query modules and the client views —
 * plain data, no `server-only`, so a client view can import the type. */

export type NoteFormula = {
  name: string;
  expression: string;
  notes: string | null;
};

export type NoteTrick = {
  name: string;
  description: string;
  whenToUse: string;
  example: string | null;
};

export type NoteWorkedExample = {
  problem: string;
  steps: string[];
  answer: string;
};

export type NoteSource = {
  name: string;
  url: string;
  tier: number;
  contribution: string;
  accessed: string;
};

/** The list-view shape — enough to render a card, nothing that isn't shown
 * until a note is opened. */
export type NoteSummary = {
  noteId: string;
  /** One of the question bank's own section labels (Quantitative, Reasoning,
   * English, GA, Computer) — see SECTION_FROM_DB in data/navigation.ts. */
  section: string;
  topic: string;
  subtopic: string | null;
  topicTitle: string;
  topicOrder: number;
  subtopicOrder: number;
  title: string;
  summary: string;
  difficulty: string | null;
  tags: string[];
};

export type NoteDetail = NoteSummary & {
  aliases: string[];
  examRelevance: { exams: string[]; stage: string[] };
  concept: string;
  formulas: NoteFormula[];
  tricks: NoteTrick[];
  commonMistakes: string[];
  workedExamples: NoteWorkedExample[];
  relatedQuestionIds: string[];
  sources: NoteSource[];
  confirmations: number | null;
};
