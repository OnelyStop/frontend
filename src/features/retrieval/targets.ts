export type Target = {
  id: string;
  kind: "spec" | "paper" | "verb";
  /** Hanging code in the slip's margin: a topic code, or the verb. */
  code: string;
  label: string;
  does: string;
  /** Extra tokens nobody would see but everybody types. */
  keys: string;
  href?: string;
  /** Verbs that are not navigation. */
  run?: "signout" | "lamp";
  resting?: boolean;
};

// Codes are section.topic — 1 Quant, 2 Reasoning, 3 English, 4 GA, 5 Computer.
const TOPICS: Array<[string, string]> = [
  ["1.1", "Simplification & Approximation"],
  ["1.2", "Number Series"],
  ["1.3", "Data Interpretation"],
  ["1.4", "Quadratic Comparison"],
  ["1.5", "Time, Speed & Distance"],
  ["1.6", "Time & Work"],
  ["1.7", "Profit & Loss"],
  ["1.8", "Simple & Compound Interest"],
  ["1.9", "Probability & Permutations"],
  ["1.10", "Mensuration"],
  ["2.1", "Puzzles & Seating Arrangement"],
  ["2.2", "Syllogism"],
  ["2.3", "Coded Inequality"],
  ["2.4", "Blood Relations"],
  ["2.5", "Input–Output"],
  ["2.6", "Coding–Decoding"],
  ["2.7", "Data Sufficiency"],
  ["3.1", "Reading Comprehension"],
  ["3.2", "Error Spotting"],
  ["3.3", "Cloze Test"],
  ["3.4", "Para Jumbles"],
  ["3.5", "Sentence Improvement"],
  ["3.6", "Fillers & Vocabulary"],
  ["4.1", "Banking Awareness"],
  ["4.2", "Current Affairs"],
  ["4.3", "Static GK"],
  ["4.4", "Indian Economy & Budget"],
  ["4.5", "RBI & Monetary Policy"],
  ["5.1", "Computer Fundamentals"],
  ["5.2", "MS Office & Shortcuts"],
  ["5.3", "Networking & Internet"],
];

const MOCKS: Array<[string, number, string]> = [
  ["IBPS PO", 2024, "Prelims"],
  ["IBPS PO", 2023, "Prelims"],
  ["SBI PO", 2024, "Prelims"],
  ["SBI PO", 2023, "Mains"],
  ["IBPS Clerk", 2024, "Prelims"],
  ["RBI Grade B", 2024, "Phase 1"],
];

const VERBS: Target[] = [
  {
    id: "v-map",
    kind: "verb",
    code: "map",
    label: "Attempt map",
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
    does: "opens a short set drawn at random from the question bank",
    keys: "drill practice set mix questions weak topics speed quick",
    href: "/drills",
    resting: true,
  },
  {
    id: "v-cards",
    kind: "verb",
    code: "cards",
    label: "Flashcards",
    does: "opens recent current-affairs questions to review",
    keys: "cards flashcards deck decks current affairs ca gk revise review due recall banking awareness formulae vocabulary news",
    href: "/flashcards",
    resting: true,
  },
  {
    id: "v-write",
    kind: "verb",
    code: "write",
    label: "Descriptive paper",
    does: "opens the answer sheet with the clock stopped",
    keys: "write descriptive letter essay marker marking mains format words",
    href: "/descriptive",
    resting: true,
  },
  {
    id: "v-cutoff",
    kind: "verb",
    code: "target",
    label: "Sectional targets",
    does: "opens today, with every section against its target",
    keys: "target targets cutoff cutoffs sectional clearing under short readiness today plan safe",
    href: "/today",
    resting: true,
  },
  {
    id: "v-progress",
    kind: "verb",
    code: "progress",
    label: "Progress and negatives",
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
    does: "opens what you have sat and what cleared",
    keys: "profile record card me account sittings scores best mocks drills",
    href: "/profile",
    resting: true,
  },
  {
    id: "v-settings",
    kind: "verb",
    code: "settings",
    label: "Settings",
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
    does: "opens the admin screen",
    keys: "admin internal ops dashboard staff",
    href: "/admin",
  },
  {
    id: "v-lamp",
    kind: "verb",
    code: "lamp",
    label: "Turn the desk light off",
    does: "switches the desk to night and leaves the paper lit",
    keys: "lamp light night dark mode desk evening late",
    run: "lamp",
  },
  {
    id: "v-signout",
    kind: "verb",
    code: "sign out",
    label: "Sign out",
    does: "ends the session and returns to the front page",
    keys: "sign out signout log out logout leave quit exit",
    run: "signout",
  },
];

function topicTarget([code, title]: (typeof TOPICS)[number]): Target {
  return {
    id: `s-${code}`,
    kind: "spec",
    code,
    label: title,
    does: "opens the attempt map",
    keys: `${title} ${code} topic practise questions`,
    // The map takes no topic param, so this opens the page rather than promising a jump it cannot make.
    href: "/attempt-map",
  };
}

function mockTarget([exam, year, stage]: (typeof MOCKS)[number]): Target {
  return {
    id: `p-${exam}-${year}-${stage}`.replace(/\s+/g, "-").toLowerCase(),
    kind: "paper",
    code: `${year}`,
    label: `${exam} ${stage}`,
    does: "opens the paper list under sectional timing",
    keys: `sit ${exam} ${year} ${stage} mock paper exam conditions timed`,
    href: "/mocks",
  };
}

export const TARGETS: Target[] = [
  ...VERBS,
  ...TOPICS.map(topicTarget),
  ...MOCKS.map(mockTarget),
];

export const RESTING = VERBS.filter((v) => v.resting);
