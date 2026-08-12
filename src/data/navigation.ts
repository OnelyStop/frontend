export type ExamBoard = "OCR" | "AQA" | "Edexcel" | "CIE";

export type Subject =
  | "Biology"
  | "Chemistry"
  | "Physics"
  | "Economics"
  | "History"
  | "English Literature"
  | "Maths";

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: string;
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
    id: "learn",
    label: "Learn",
    items: [
      { id: "home", label: "Home", path: "/", icon: "home" },
      { id: "question-bank", label: "Question Bank", path: "/question-bank", icon: "library" },
      { id: "past-papers", label: "Past Papers", path: "/past-papers", icon: "file-search", badge: "NEW" },
      { id: "pyq-mix", label: "PYQ Mix", path: "/pyq-mix", icon: "shuffle" },
      { id: "ai-exams", label: "AI-Curated Exams", path: "/ai-exams", icon: "clipboard" },
      { id: "theory", label: "Theory & Tricks", path: "/theory", icon: "lightbulb" },
      { id: "revision", label: "Revision Guide", path: "/revision", icon: "book" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    items: [
      {
        id: "marker",
        label: "Answer Marker",
        path: "/marker",
        icon: "pen",
        dynamicLabel: true,
        badge: "NEW",
      },
      { id: "diagrams", label: "Diagram Generator", path: "/diagrams", icon: "shapes" },
      { id: "interview", label: "AI Interview", path: "/interview", icon: "mic", badge: "BETA" },
      { id: "tutor", label: "AI Tutor", path: "/tutor", icon: "bot" },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    items: [
      { id: "progress", label: "Progress Tracker", path: "/progress", icon: "chart" },
      { id: "memory", label: "A* Memory", path: "/memory", icon: "brain" },
      { id: "notes", label: "Sticky Notes", path: "/notes", icon: "sticky" },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { id: "profile", label: "Profile", path: "/profile", icon: "user" },
      { id: "settings", label: "Settings", path: "/settings", icon: "settings" },
    ],
  },
];

// A* Ascent — grade ladder shown in the dock rail. Thresholds are the
// mastery % needed to be "working at" each grade; the rail interpolates
// between stops so progress is continuous, not stepped.
export const GRADE_LADDER = [
  { grade: "C", threshold: 0 },
  { grade: "B", threshold: 40 },
  { grade: "A", threshold: 65 },
  { grade: "A*", threshold: 85 },
] as const;

export type Grade = (typeof GRADE_LADDER)[number]["grade"];

// Mastery per learn-feature nav id — mock values until backend wiring
export const FEATURE_MASTERY: Record<string, number> = {
  "question-bank": 72,
  "past-papers": 45,
  "pyq-mix": 61,
  "ai-exams": 30,
  theory: 84,
  revision: 58,
};

export function gradeFromMastery(mastery: number): {
  grade: Grade;
  next: Grade | null;
} {
  let index = 0;
  for (let i = 0; i < GRADE_LADDER.length; i++) {
    if (mastery >= GRADE_LADDER[i].threshold) index = i;
  }
  return {
    grade: GRADE_LADDER[index].grade,
    next: GRADE_LADDER[index + 1]?.grade ?? null,
  };
}

// Maps mastery % to a 0–1 position along the rail, piecewise-linear
// between ladder stops so each grade band occupies one visual segment.
export function railPositionFromMastery(mastery: number): number {
  const last = GRADE_LADDER.length - 1;
  if (mastery >= GRADE_LADDER[last].threshold) return 1;
  for (let i = last - 1; i >= 0; i--) {
    const from = GRADE_LADDER[i].threshold;
    const to = GRADE_LADDER[i + 1].threshold;
    if (mastery >= from) {
      return (i + (mastery - from) / (to - from)) / last;
    }
  }
  return 0;
}

export const ESSAY_SUBJECTS: Subject[] = ["Economics", "History", "English Literature"];

export function getMarkerLabel(subject: Subject): string {
  if (subject === "English Literature") return "Essay Marker";
  if (ESSAY_SUBJECTS.includes(subject)) return "Long Answer Marker";
  return "Answer Marker";
}

export const TOPICS = [
  "Cell Biology",
  "Genetics",
  "Ecology",
  "Organic Chemistry",
  "Mechanics",
  "Electricity",
  "Macroeconomics",
  "Cold War",
  "Algebra",
  "Probability",
];

export const SAMPLE_LESSONS = [
  {
    id: "1",
    title: "Topic map & exam blueprint",
    meta: "12 min · Overview",
    done: true,
    icon: "map",
  },
  {
    id: "2",
    title: "High-yield definitions drill",
    meta: "18 min · Practice",
    done: true,
    icon: "drill",
  },
  {
    id: "3",
    title: "Command words & mark schemes",
    meta: "22 min · Exam skill",
    done: false,
    active: true,
    icon: "scheme",
  },
  {
    id: "4",
    title: "Worked PYQs — medium band",
    meta: "30 min · PYQ",
    done: false,
    icon: "pyq",
  },
  {
    id: "5",
    title: "Timed mixed set",
    meta: "25 min · Mixed",
    done: false,
    icon: "timer",
  },
];
