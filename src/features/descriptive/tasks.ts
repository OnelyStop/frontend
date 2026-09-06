/** The client's `checks` and the `brief` the marking route sends the model must describe the same task, so both come from here. */

export type FormatCheck = {
  label: string;
  hint: string;
  test: (text: string) => boolean;
};

export type DescriptiveTask = {
  id: string;
  kind: "Letter" | "Essay";
  title: string;
  brief: string;
  min: number;
  max: number;
  marks: number;
  checks: FormatCheck[];
};

const has = (t: string, ...words: string[]) =>
  words.some((w) => t.toLowerCase().includes(w));

export const paragraphs = (t: string) =>
  t
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const wordCount = (t: string) =>
  t.trim().split(/\s+/).filter(Boolean).length;

export const TASKS: DescriptiveTask[] = [
  {
    id: "letter",
    kind: "Letter",
    title: "Formal letter to a branch manager",
    brief:
      "Write a letter to the manager of your bank branch complaining that an ATM cash withdrawal was debited from your account but the cash was not dispensed. Include the date, amount and ATM location, and state the resolution you expect.",
    min: 120,
    max: 150,
    marks: 10,
    checks: [
      {
        label: "Salutation",
        hint: "Formal letters open with Sir / Madam — never Hi or Dear friend.",
        test: (t) => has(t, "sir", "madam"),
      },
      {
        label: "Subject line",
        hint: "One line naming the issue. Examiners look for it before they read.",
        test: (t) => has(t, "subject:", "sub:", "subject -"),
      },
      {
        label: "Specifics given",
        hint: "A complaint without a date, amount or account reference is unmarkable.",
        test: (t) => /\d/.test(t) && has(t, "atm", "account", "transaction"),
      },
      {
        label: "Action requested",
        hint: "Say what you want done — reversal, credit, investigation.",
        test: (t) =>
          has(t, "request", "kindly", "refund", "reversal", "credit"),
      },
      {
        label: "Formal closing",
        hint: "Yours faithfully / sincerely, then your name.",
        test: (t) => has(t, "yours faithfully", "yours sincerely", "regards"),
      },
    ],
  },
  {
    id: "essay",
    kind: "Essay",
    title: "Essay — digital lending in India",
    brief:
      "Digital lending apps have widened credit access but also driven predatory recovery practices. Discuss, and suggest what the RBI's role should be.",
    min: 200,
    max: 250,
    marks: 15,
    checks: [
      {
        label: "Opens with a position",
        hint: "The first paragraph should say what you will argue, not define the topic.",
        test: (t) => {
          const first = paragraphs(t)[0];
          return first !== undefined && wordCount(first) >= 25;
        },
      },
      {
        label: "Three or more paragraphs",
        hint: "Intro, body, conclusion. A wall of text loses organisation marks.",
        test: (t) => paragraphs(t).length >= 3,
      },
      {
        label: "Both sides argued",
        hint: "'Discuss' means the counter-view must appear, not just your own.",
        test: (t) =>
          has(t, "however", "on the other hand", "although", "whereas"),
      },
      {
        label: "Concrete evidence",
        hint: "A number, a scheme, a regulator, a year — something checkable.",
        test: (t) =>
          /\d/.test(t) && has(t, "rbi", "guideline", "act", "committee"),
      },
      {
        label: "Conclusion proposes",
        hint: "End with what should happen, not a summary of what you said.",
        test: (t) => has(t, "should", "must", "recommend", "way forward"),
      },
    ],
  },
];

export const taskById = (id: string): DescriptiveTask | undefined =>
  TASKS.find((t) => t.id === id);
