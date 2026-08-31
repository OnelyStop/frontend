/* What ⌘K can reach. Three kinds, one list: the topics you are examined on,
   the mocks you can sit, and the verbs. Everything an aspirant would type at
   11pm resolves to one of these. */

export type Wash = "none" | "shaky" | "mid" | "secure" | "cool";

export type Target = {
  id: string;
  kind: "spec" | "paper" | "verb";
  /** Hanging code in the slip's margin: a topic code, or the verb. */
  code: string;
  label: string;
  /** Printed to the right of the label. */
  detail: string;
  /** What Enter does. */
  does: string;
  /** Extra tokens nobody would see but everybody types. */
  keys: string;
  href?: string;
  /** Verbs that are not navigation. */
  run?: "signout" | "lamp";
  wash?: Wash;
  /** Shown in the resting state, before a single key is pressed. */
  resting?: boolean;
};

/* Codes are section.topic — 1 Quant, 2 Reasoning, 3 English, 4 GA, 5 Computer.
   The wash is authored, not simulated: it has to mean the same thing here as
   it does on the attempt map. */
const TOPICS: Array<[string, string, number, number, Wash]> = [
  ["1.1", "Simplification & Approximation", 240, 22, "secure"],
  ["1.2", "Number Series", 180, 38, "mid"],
  ["1.3", "Data Interpretation", 320, 72, "shaky"],
  ["1.4", "Quadratic Comparison", 140, 31, "secure"],
  ["1.5", "Time, Speed & Distance", 160, 68, "shaky"],
  ["1.6", "Time & Work", 160, 68, "shaky"],
  ["1.7", "Profit & Loss", 130, 44, "mid"],
  ["1.8", "Simple & Compound Interest", 120, 41, "mid"],
  ["1.9", "Probability & Permutations", 90, 84, "none"],
  ["1.10", "Mensuration", 80, 57, "none"],
  ["2.1", "Puzzles & Seating Arrangement", 280, 95, "shaky"],
  ["2.2", "Syllogism", 150, 27, "secure"],
  ["2.3", "Coded Inequality", 120, 19, "secure"],
  ["2.4", "Blood Relations", 100, 41, "mid"],
  ["2.5", "Input–Output", 80, 88, "none"],
  ["2.6", "Coding–Decoding", 110, 36, "mid"],
  ["2.7", "Data Sufficiency", 70, 52, "shaky"],
  ["3.1", "Reading Comprehension", 260, 58, "mid"],
  ["3.2", "Error Spotting", 140, 26, "secure"],
  ["3.3", "Cloze Test", 120, 49, "shaky"],
  ["3.4", "Para Jumbles", 90, 62, "none"],
  ["3.5", "Sentence Improvement", 110, 33, "mid"],
  ["3.6", "Fillers & Vocabulary", 95, 29, "mid"],
  ["4.1", "Banking Awareness", 300, 18, "secure"],
  ["4.2", "Current Affairs", 420, 15, "shaky"],
  ["4.3", "Static GK", 210, 17, "shaky"],
  ["4.4", "Indian Economy & Budget", 140, 21, "mid"],
  ["4.5", "RBI & Monetary Policy", 120, 19, "cool"],
  ["5.1", "Computer Fundamentals", 130, 16, "secure"],
  ["5.2", "MS Office & Shortcuts", 90, 14, "cool"],
  ["5.3", "Networking & Internet", 70, 18, "mid"],
];

const MOCKS: Array<[string, number, string, string, number]> = [
  ["IBPS PO", 2024, "Prelims", "60 min", 58],
  ["IBPS PO", 2023, "Prelims", "60 min", 56],
  ["SBI PO", 2024, "Prelims", "60 min", 62],
  ["SBI PO", 2023, "Mains", "3 hr", 74],
  ["IBPS Clerk", 2024, "Prelims", "60 min", 60],
  ["RBI Grade B", 2024, "Phase 1", "2 hr", 88],
];

const VERBS: Target[] = [
  {
    id: "v-map",
    kind: "verb",
    code: "map",
    label: "Attempt map",
    detail: "19 topics plotted",
    does: "opens accuracy against pace, with your skip list",
    keys: "map attempt skip quadrant accuracy pace speed strategy which questions leave",
    href: "/attempt-map",
    resting: true,
  },
  {
    id: "v-sit",
    kind: "verb",
    code: "sit",
    label: "Sit a mock",
    detail: "6 papers",
    does: "opens the paper list under sectional timing",
    keys: "sit mock mocks paper papers past exam timed conditions prelims mains",
    href: "/mocks",
    resting: true,
  },
  {
    id: "v-drill",
    kind: "verb",
    code: "drill",
    label: "Start a drill",
    detail: "20 questions · 15 min",
    does: "opens a set already aimed at your weak topics",
    keys: "drill practice set mix questions weak topics speed quick",
    href: "/drills",
    resting: true,
  },
  {
    id: "v-cards",
    kind: "verb",
    code: "cards",
    label: "Flashcards",
    detail: "5 decks due",
    does: "opens your decks — current affairs, banking, static GK, formulae",
    keys: "cards flashcards deck decks current affairs ca gk revise review due recall banking awareness formulae vocabulary news",
    href: "/flashcards",
    resting: true,
  },
  {
    id: "v-write",
    kind: "verb",
    code: "write",
    label: "Descriptive paper",
    detail: "letter + essay · 30 min",
    does: "opens the answer sheet with the clock stopped",
    keys: "write descriptive letter essay marker marking mains format words",
    href: "/descriptive",
    resting: true,
  },
  {
    id: "v-cutoff",
    kind: "verb",
    code: "cutoff",
    label: "Sectional cutoffs",
    detail: "1 section under",
    does: "opens today, with every section against its cutoff",
    keys: "cutoff cutoffs sectional clearing under short readiness today plan safe",
    href: "/home",
    resting: true,
  },
  {
    id: "v-progress",
    kind: "verb",
    code: "progress",
    label: "Progress and negatives",
    detail: "marks lost to −0.25",
    does: "opens accuracy, pace and what negative marking took",
    keys: "progress record history results accuracy pace negative marking lost stats",
    href: "/progress",
    resting: true,
  },
  {
    id: "v-notes",
    kind: "verb",
    code: "notes",
    label: "Notes and formulae",
    detail: "6 notes",
    does: "opens your formulae and shortcuts by section",
    keys: "notes note formula formulae shortcut trick tip working",
    href: "/notes",
    resting: true,
  },
  {
    id: "v-community",
    kind: "verb",
    code: "doubts",
    label: "Community doubts",
    detail: "3 of 5 posts left",
    does: "opens the doubts ranked by how many are stuck",
    keys: "community doubt doubts ask room thread discussion help stuck query",
    href: "/community",
    resting: true,
  },
  {
    id: "v-profile",
    kind: "verb",
    code: "profile",
    label: "Your record card",
    detail: "sittings and best sections",
    does: "opens what you have sat and what cleared",
    keys: "profile record card me account sittings scores streak points",
    href: "/profile",
    resting: true,
  },
  {
    id: "v-settings",
    kind: "verb",
    code: "settings",
    label: "Settings",
    detail: "",
    does: "opens your settings",
    keys: "settings preferences account exam section reminders notifications",
    href: "/settings",
    resting: true,
  },
  {
    id: "v-upgrade",
    kind: "verb",
    code: "upgrade",
    label: "Upgrade to Pro",
    detail: "unlimited mocks and marking",
    does: "opens the plans",
    keys: "upgrade pro plan plans price pricing billing subscribe pay",
    href: "/upgrade",
    resting: true,
  },
  {
    id: "v-admin",
    kind: "verb",
    code: "admin",
    label: "Admin",
    detail: "internal",
    does: "opens the admin screen",
    keys: "admin internal ops dashboard staff",
    href: "/admin",
  },
  {
    id: "v-lamp",
    kind: "verb",
    code: "lamp",
    label: "Turn the desk light off",
    detail: "the sheet stays lit",
    does: "switches the desk to night and leaves the paper lit",
    keys: "lamp light night dark mode desk evening late",
    run: "lamp",
  },
  {
    id: "v-signout",
    kind: "verb",
    code: "sign out",
    label: "Sign out",
    detail: "",
    does: "ends the session and returns to the front page",
    keys: "sign out signout log out logout leave quit exit",
    run: "signout",
  },
];

function topicTarget([
  code,
  title,
  attempted,
  seconds,
  wash,
]: (typeof TOPICS)[number]): Target {
  return {
    id: `s-${code}`,
    kind: "spec",
    code,
    label: title,
    detail: `${attempted} done · ${seconds}s`,
    does: "opens the topic on the attempt map",
    keys: `${title} ${code} topic practise questions`,
    // A deep link into the map, not a route of its own: the topic is a state
    // of that page and a real URL both.
    href: `/attempt-map?spec=${code}`,
    wash,
  };
}

function mockTarget([
  exam,
  year,
  stage,
  length,
  cutoff,
]: (typeof MOCKS)[number]): Target {
  return {
    id: `p-${exam}-${year}-${stage}`.replace(/\s+/g, "-").toLowerCase(),
    kind: "paper",
    code: `${year}`,
    label: `${exam} ${stage}`,
    detail: `${length} · cutoff ${cutoff}`,
    does: "sits it under sectional timing",
    keys: `sit ${exam} ${year} ${stage} mock paper exam conditions timed`,
    href: `/mocks?sit=${year}-p1`,
  };
}

export const TARGETS: Target[] = [
  ...VERBS,
  ...TOPICS.map(topicTarget),
  ...MOCKS.map(mockTarget),
];

export const RESTING = VERBS.filter((v) => v.resting);

/** R / A / G / — : the wash is also a letter, for the 8% who cannot read hue. */
export const RAG: Record<Wash, string> = {
  none: "—",
  shaky: "R",
  mid: "A",
  secure: "G",
  cool: "G",
};
