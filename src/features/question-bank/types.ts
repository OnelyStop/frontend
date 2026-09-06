/** Deliberately free of `server-only`, so a client view can import these. */

export type Mock = {
  id: string;
  name: string;
  year: number;
  stage: "Prelims" | "Mains";
  qs: number;
  mins: number;
  score: number | null;
  /** 55% of the question count — our practice benchmark, not a published cutoff. */
  target: number;
};

export type DrillQuestion = {
  qId: string;
  /** A question-bank section label, not a full subject name — see SECTION_DB in data/navigation.ts. */
  section: string;
  topic: string | null;
  stem: string;
  direction: string | null;
  options: { key: string; text: string }[];
};
