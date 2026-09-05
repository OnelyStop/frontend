/** Shapes shared between the server query modules and the client views —
 * plain data, no `server-only`, so a client view can import the type. */

export type Mock = {
  id: string;
  name: string;
  year: number;
  stage: "Prelims" | "Mains";
  qs: number;
  mins: number;
  score: number | null;
  cutoff: number;
};

export type DrillQuestion = {
  qId: string;
  /** One of the question bank's own section labels — see SECTION_DB in
   * data/navigation.ts for the mapping from a Subject's full name. */
  section: string;
  topic: string | null;
  stem: string;
  direction: string | null;
  options: { key: string; text: string }[];
};
