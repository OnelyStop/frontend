/** The broad exam a learner is preparing for. Specific boards are a property of a paper, never something a learner picks. */
export const EXAM_TYPE_VALUES = ["Banking", "NEET", "IIT JEE"] as const;

// Derived, so the zod enum and the column type cannot drift apart.
export type ExamBoard = (typeof EXAM_TYPE_VALUES)[number];

export type Subject =
  | "Quantitative Aptitude"
  | "Reasoning Ability"
  | "English Language"
  | "General Awareness"
  | "Computer Aptitude";

export const SECTIONS = [
  "Quantitative Aptitude",
  "Reasoning Ability",
  "English Language",
  "General Awareness",
  "Computer Aptitude",
] as const satisfies readonly Subject[];

/** Picked at signup and changeable in Settings. The unbuilt ones are shown, not hidden, so the list reads as a roadmap. */
export const EXAM_TYPES: {
  value: ExamBoard;
  detail: string;
  live: boolean;
}[] = [
  {
    value: "Banking",
    detail: "SBI, IBPS and RRB — every prelims and mains paper",
    live: true,
  },
  { value: "NEET", detail: "Coming soon", live: false },
  { value: "IIT JEE", detail: "Coming soon", live: false },
];

/** Named on the marketing pages because these are the words people search for; no learner selects one. Every entry has papers behind it — RBI Grade B was listed here with none. */
export const BANKING_EXAMS = [
  "IBPS PO",
  "IBPS Clerk",
  "IBPS RRB",
  "SBI PO",
  "SBI Clerk",
] as const;

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
