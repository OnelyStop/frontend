/* Domain: Indian banking exams (IBPS / SBI PO & Clerk, RBI Grade B).
   Sections replace subjects; the paper replaces the exam board. */

export type ExamBoard =
  "IBPS PO" | "IBPS Clerk" | "SBI PO" | "SBI Clerk" | "RBI Grade B";

export type Subject =
  | "Quantitative Aptitude"
  | "Reasoning Ability"
  | "English Language"
  | "General Awareness"
  | "Computer Aptitude";

export const SECTIONS: Subject[] = [
  "Quantitative Aptitude",
  "Reasoning Ability",
  "English Language",
  "General Awareness",
  "Computer Aptitude",
];

export const EXAMS: ExamBoard[] = [
  "IBPS PO",
  "IBPS Clerk",
  "SBI PO",
  "SBI Clerk",
  "RBI Grade B",
];

export const SECTION_KEY: Record<Subject, string> = {
  "Quantitative Aptitude": "quant",
  "Reasoning Ability": "reasoning",
  "English Language": "english",
  "General Awareness": "ga",
  "Computer Aptitude": "computer",
};

export const SECTION_SHORT: Record<Subject, string> = {
  "Quantitative Aptitude": "Quant",
  "Reasoning Ability": "Reasoning",
  "English Language": "English",
  "General Awareness": "GA",
  "Computer Aptitude": "Computer",
};

/* Negative marking is 1/4 of a mark on every wrong answer across IBPS and SBI.
   It is the single fact that governs attempt strategy, so it lives here. */
export const NEGATIVE_MARK = 0.25;

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: string;
  /** One line under the label in the header menu — what the screen is for. */
  hint: string;
  badge?: "NEW" | "BETA";
  dynamicLabel?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "practise",
    label: "Practise",
    items: [
      {
        id: "home",
        label: "Today",
        path: "/home",
        icon: "home",
        hint: "Every section against its cutoff, and the next hour planned",
      },
      {
        id: "attempt-map",
        label: "Attempt map",
        path: "/attempt-map",
        icon: "library",
        hint: "Accuracy against pace — what to bank and what to skip",
      },
      {
        id: "mocks",
        label: "Mocks",
        path: "/mocks",
        icon: "file-search",
        hint: "Full papers under real sectional timing",
      },
      {
        id: "drills",
        label: "Drills",
        path: "/drills",
        icon: "shuffle",
        hint: "A short set aimed at the topics costing you marks",
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
        icon: "news",
        hint: "One grounded MCQ per major story, from the day's news and RBI/PIB/SEBI",
        badge: "NEW",
      },
      {
        id: "flashcards",
        label: "Flashcards",
        path: "/flashcards",
        icon: "brain",
        hint: "Current affairs, banking awareness, formulae — reveal and grade",
      },
      {
        id: "notes",
        label: "Notes",
        path: "/notes",
        icon: "sticky",
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
        icon: "chart",
        hint: "Accuracy, pace, and what negative marking took back",
      },
      {
        id: "descriptive",
        label: "Descriptive",
        path: "/descriptive",
        icon: "pen",
        hint: "Letter and essay against the clock, format checked live",
        dynamicLabel: true,
      },
      {
        id: "community",
        label: "Community",
        path: "/community",
        icon: "users",
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
        icon: "user",
        hint: "Your record card — sittings, scores and best sections",
      },
      {
        id: "settings",
        label: "Settings",
        path: "/settings",
        icon: "settings",
        hint: "Details, the exam you are calibrated to, notifications",
      },
      {
        id: "upgrade",
        label: "Upgrade",
        path: "/upgrade",
        icon: "spark",
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

export type Band = (typeof CUTOFF_LADDER)[number]["band"];

export const FEATURE_MASTERY: Record<string, number> = {
  "attempt-map": 64,
  mocks: 48,
  drills: 57,
  flashcards: 71,
};

export function bandFromScore(score: number): {
  band: Band;
  next: Band | null;
} {
  let index = 0;
  for (let i = 0; i < CUTOFF_LADDER.length; i++) {
    if (score >= CUTOFF_LADDER[i].threshold) index = i;
  }
  return {
    band: CUTOFF_LADDER[index].band,
    next: CUTOFF_LADDER[index + 1]?.band ?? null,
  };
}

export function railPositionFromMastery(mastery: number): number {
  const last = CUTOFF_LADDER.length - 1;
  if (mastery >= CUTOFF_LADDER[last].threshold) return 1;
  for (let i = last - 1; i >= 0; i--) {
    const from = CUTOFF_LADDER[i].threshold;
    const to = CUTOFF_LADDER[i + 1].threshold;
    if (mastery >= from) return (i + (mastery - from) / (to - from)) / last;
  }
  return 0;
}

/* Descriptive papers exist only in SBI PO Mains and RBI Grade B. */
export const DESCRIPTIVE_EXAMS: ExamBoard[] = ["SBI PO", "RBI Grade B"];

export function getMarkerLabel(exam: ExamBoard): string {
  return DESCRIPTIVE_EXAMS.includes(exam)
    ? "Descriptive"
    : "Descriptive (Mains)";
}
