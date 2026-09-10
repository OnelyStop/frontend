export type ExamBoard =
  "IBPS PO" | "IBPS Clerk" | "SBI PO" | "SBI Clerk" | "RBI Grade B";

export type Subject =
  | "Quantitative Aptitude"
  | "Reasoning Ability"
  | "English Language"
  | "General Awareness"
  | "Computer Aptitude";

// `as const` so z.enum() infers the literal union the column type needs.
export const SECTIONS = [
  "Quantitative Aptitude",
  "Reasoning Ability",
  "English Language",
  "General Awareness",
  "Computer Aptitude",
] as const satisfies readonly Subject[];

export const EXAMS = [
  "IBPS PO",
  "IBPS Clerk",
  "SBI PO",
  "SBI Clerk",
  "RBI Grade B",
] as const satisfies readonly ExamBoard[];

export const SECTION_KEY: Record<Subject, string> = {
  "Quantitative Aptitude": "quant",
  "Reasoning Ability": "reasoning",
  "English Language": "english",
  "General Awareness": "ga",
  "Computer Aptitude": "computer",
};

export const SECTION_LABEL: Record<Subject, string> = {
  "Quantitative Aptitude": "Quantitative Aptitude",
  "Reasoning Ability": "Reasoning Ability",
  "English Language": "English Language",
  "General Awareness": "General Awareness",
  "Computer Aptitude": "Computer Aptitude",
};

/* For a filter or a chip, where the full names wrap to a second line and stretch the control. */
export const SECTION_SHORT: Record<Subject, string> = {
  "Quantitative Aptitude": "Quant",
  "Reasoning Ability": "Reasoning",
  "English Language": "English",
  "General Awareness": "GA",
  "Computer Aptitude": "Computer",
};

/* The question bank stores one-word section names; joining a query on the full subject name silently returns zero rows, not an error. */
export const SECTION_DB: Record<Subject, string> = {
  "Quantitative Aptitude": "Quantitative",
  "Reasoning Ability": "Reasoning",
  "English Language": "English",
  "General Awareness": "GA",
  "Computer Aptitude": "Computer",
};

export const SECTION_FROM_DB: Record<string, Subject> = Object.fromEntries(
  Object.entries(SECTION_DB).map(([subject, db]) => [db, subject as Subject]),
);

/* IBPS and SBI both deduct a quarter mark for every wrong answer. */
export const NEGATIVE_MARK = 0.25;

export type NavItem = {
  id: string;
  label: string;
  path: string;
  hint: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "learn",
    label: "Learn",
    items: [
      {
        id: "study",
        label: "Knowledge base",
        path: "/study",
        hint: "Subjects, chapters and topics — read, take private notes, ask Onely about any passage",
      },
    ],
  },
  {
    id: "practise",
    label: "Practise",
    items: [
      {
        id: "home",
        label: "Today",
        path: "/today",
        hint: "Every section against its cutoff, and the next hour planned",
      },
      {
        id: "attempt-map",
        label: "Attempt map",
        path: "/attempt-map",
        hint: "Accuracy against pace — what to bank and what to skip",
      },
      {
        id: "mocks",
        label: "Mocks",
        path: "/mocks",
        hint: "Full papers under real sectional timing",
      },
      {
        id: "drills",
        label: "Drills",
        path: "/drills",
        hint: "A short set drawn at random from the question bank",
      },
    ],
  },
  {
    id: "recall",
    label: "Recall",
    items: [
      {
        id: "current-affairs",
        label: "Current affairs",
        path: "/current-affairs",
        hint: "One grounded MCQ per major story, from the day's news and RBI/PIB/SEBI",
      },
      {
        id: "flashcards",
        label: "Flashcards",
        path: "/flashcards",
        hint: "Recent current-affairs questions — reveal and review",
      },
      {
        id: "notes",
        label: "Notes",
        path: "/notes",
        hint: "Formulae, shortcuts and the traps you keep falling for",
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    items: [
      {
        id: "progress",
        label: "Progress",
        path: "/progress",
        hint: "Accuracy, pace, and what negative marking took back",
      },
      {
        id: "descriptive",
        label: "Descriptive",
        path: "/descriptive",
        hint: "Letter and essay against the clock, format checked live",
      },
      {
        id: "community",
        label: "Community",
        path: "/community",
        hint: "Doubts ranked by how many people are stuck there",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "profile",
        label: "Profile",
        path: "/profile",
        hint: "Your record card — sittings, scores and best sections",
      },
      {
        id: "settings",
        label: "Settings",
        path: "/settings",
        hint: "Details, and the exam you are calibrated to",
      },
      {
        id: "upgrade",
        label: "Upgrade",
        path: "/upgrade",
        hint: "Unlimited mocks, marking and current affairs",
      },
    ],
  },
];

/* Readiness is measured against the sectional cutoff, not a grade. */
export const CUTOFF_LADDER = [
  { band: "Below cutoff", threshold: 0 },
  { band: "At cutoff", threshold: 55 },
  { band: "Safe", threshold: 70 },
  { band: "Strong", threshold: 85 },
] as const;

/* Descriptive papers exist only in SBI PO Mains and RBI Grade B. */
export const DESCRIPTIVE_EXAMS: ExamBoard[] = ["SBI PO", "RBI Grade B"];

export function getMarkerLabel(exam: ExamBoard): string {
  return DESCRIPTIVE_EXAMS.includes(exam)
    ? "Descriptive"
    : "Descriptive (Mains)";
}
