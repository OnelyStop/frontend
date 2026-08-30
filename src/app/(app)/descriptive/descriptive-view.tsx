"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Card, PageHeader, SectionTitle } from "@/design-system";

/* The descriptive paper. IBPS PO Mains and SBI PO give you 30 minutes for one
   letter and one essay, and most marks are lost to format and length, not to
   ideas. So the format checklist ticks live as you type — you should never
   reach the end of 30 minutes and discover you forgot the subject line. */

type Task = {
  id: string;
  kind: "Letter" | "Essay";
  title: string;
  brief: string;
  min: number;
  max: number;
  marks: number;
  /* Each check is a real test against the draft, not a rubric line to read. */
  checks: { label: string; hint: string; test: (t: string) => boolean }[];
};

const has = (t: string, ...words: string[]) =>
  words.some((w) => t.toLowerCase().includes(w));

const paras = (t: string) =>
  t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

const TASKS: Task[] = [
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
        test: (t) => has(t, "request", "kindly", "refund", "reversal", "credit"),
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
        test: (t) => paras(t).length > 0 && paras(t)[0].split(/\s+/).length >= 25,
      },
      {
        label: "Three or more paragraphs",
        hint: "Intro, body, conclusion. A wall of text loses organisation marks.",
        test: (t) => paras(t).length >= 3,
      },
      {
        label: "Both sides argued",
        hint: "'Discuss' means the counter-view must appear, not just your own.",
        test: (t) => has(t, "however", "on the other hand", "although", "whereas"),
      },
      {
        label: "Concrete evidence",
        hint: "A number, a scheme, a regulator, a year — something checkable.",
        test: (t) => /\d/.test(t) && has(t, "rbi", "guideline", "act", "committee"),
      },
      {
        label: "Conclusion proposes",
        hint: "End with what should happen, not a summary of what you said.",
        test: (t) => has(t, "should", "must", "recommend", "way forward"),
      },
    ],
  },
];

const TOTAL_S = 30 * 60;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function DescriptiveView() {
  const { board } = useApp();
  const [idx, setIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(TOTAL_S);
  const [running, setRunning] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const task = TASKS[idx];
  const draft = drafts[task.id] ?? "";
  const isMarked = !!marked[task.id];

  useEffect(() => {
    if (!running || left <= 0) return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running, left]);

  const words = useMemo(
    () => draft.trim().split(/\s+/).filter(Boolean).length,
    [draft],
  );

  const passed = useMemo(
    () => task.checks.map((c) => c.test(draft)),
    [draft, task],
  );

  // Length is scored as a band, not a hard cut: examiners tolerate a small
  // overshoot far better than a short answer.
  const lengthBand =
    words === 0
      ? "empty"
      : words < task.min * 0.7
        ? "short"
        : words < task.min
          ? "near"
          : words <= task.max
            ? "in"
            : words <= task.max * 1.2
              ? "over"
              : "long";

  const score = useMemo(() => {
    const structural = passed.filter(Boolean).length / task.checks.length;
    const length =
      lengthBand === "in" ? 1 : lengthBand === "over" || lengthBand === "near" ? 0.7 : 0.3;
    return Math.round(task.marks * (structural * 0.7 + length * 0.3) * 2) / 2;
  }, [passed, lengthBand, task]);

  const start = () => {
    setRunning(true);
    areaRef.current?.focus();
  };

  return (
    <div>
      <PageHeader
        title="Descriptive"
        sub={`${board} Mains · one letter and one essay in 30 minutes. Most marks here are lost to format and length, not to ideas.`}
        actions={
          <>
            <span
              className={`tnum mr-1 rounded-pill px-3 py-1.5 text-[16px] ${
                left < 300
                  ? "bg-bad-soft text-bad"
                  : running
                    ? "text-ink"
                    : "text-ink-3"
              }`}
            >
              {fmt(left)}
            </span>
            {running ? (
              <Button variant="secondary" onClick={() => setRunning(false)}>
                Pause
              </Button>
            ) : (
              <Button onClick={start}>
                {left === TOTAL_S ? "Start 30 min" : "Resume"}
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0">
          <div className="mb-6 inline-flex gap-1 rounded-pill border border-line p-1">
            {TASKS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-pill px-4 py-1.5 text-[14px] transition-colors ${
                  idx === i ? "bg-ink text-white" : "text-ink-3 hover:text-ink"
                }`}
              >
                {t.kind} · {t.marks} marks
              </button>
            ))}
          </div>

          <h2 className="text-[18px]">{task.title}</h2>
          <p className="mt-2 max-w-[72ch] text-[14px] leading-relaxed text-ink-2">
            {task.brief}
          </p>

          <textarea
            ref={areaRef}
            value={draft}
            onChange={(e) => {
              setDrafts({ ...drafts, [task.id]: e.target.value });
              if (isMarked) setMarked({ ...marked, [task.id]: false });
            }}
            placeholder={
              task.kind === "Letter"
                ? "Sir / Madam,\n\nSubject: …"
                : "Write your essay here."
            }
            spellCheck={false}
            className="ruled mt-5 min-h-[420px] w-full resize-y rounded-[14px] border border-line bg-canvas px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-ink-4 focus:border-brand focus:bg-canvas"
          />

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="tnum text-[13px] text-ink-3">
              <b
                className={`${
                  lengthBand === "in"
                    ? "text-ok"
                    : lengthBand === "long"
                      ? "text-bad"
                      : "text-ink"
                }`}
              >
                {words}
              </b>{" "}
              / {task.min}–{task.max} words
            </span>

            {/* The word budget as a single bar: the shaded stretch is the band
                the examiner expects you to land in. */}
            <span className="relative h-2 max-w-64 flex-1 overflow-hidden rounded-pill bg-line">
              <span
                className="absolute inset-y-0 bg-line-2"
                style={{
                  left: `${(task.min / (task.max * 1.4)) * 100}%`,
                  width: `${((task.max - task.min) / (task.max * 1.4)) * 100}%`,
                }}
                aria-hidden
              />
              <span
                className={`absolute inset-y-0 left-0 rounded-pill ${
                  lengthBand === "in"
                    ? "bg-ok"
                    : lengthBand === "long"
                      ? "bg-bad"
                      : "bg-brand"
                }`}
                style={{
                  width: `${Math.min(100, (words / (task.max * 1.4)) * 100)}%`,
                }}
              />
            </span>

            <Button
              disabled={words < 20}
              onClick={() => setMarked({ ...marked, [task.id]: true })}
            >
              Mark this
            </Button>
          </div>

          {isMarked ? (
            <div className="mt-5 rounded-[14px] bg-canvas p-5 ring-1 ring-line">
              <div className="flex items-baseline gap-3">
                <span className="tnum text-2xl">
                  {score}
                  <span className="text-ink-3">/{task.marks}</span>
                </span>
                <span className="text-[13px] text-ink-3">
                  {passed.filter(Boolean).length} of {task.checks.length}{" "}
                  requirements met · length {lengthBand === "in" ? "in band" : lengthBand}
                </span>
              </div>
              <p className="mt-3 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
                {passed.every(Boolean) && lengthBand === "in"
                  ? "Format and length are both clean. What separates this from full marks now is the quality of the argument — read it back and cut every sentence that repeats the one before."
                  : `Fix the unticked items on the right first. Format marks are the cheapest ${task.marks} marks in the paper and they are lost silently.`}
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="h-fit">
          <SectionTitle
            aside={
              <span className="tnum text-[13px] text-ink-3">
                {passed.filter(Boolean).length}/{task.checks.length}
              </span>
            }
          >
            Format checklist
          </SectionTitle>
          <ul className="grid gap-3.5">
            {task.checks.map((c, i) => (
              <li key={c.label} className="flex gap-2.5">
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${
                    passed[i]
                      ? "bg-ok text-white"
                      : "border border-line-2 text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span>
                  <span
                    className={`block text-[13px] font-medium ${
                      passed[i] ? "text-ink-3 line-through" : "text-ink"
                    }`}
                  >
                    {c.label}
                  </span>
                  {!passed[i] ? (
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">
                      {c.hint}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-3">
            The checklist tests your actual draft — it is not a rubric you read.
            Nothing here is graded on style; it is the format and length that
            candidates lose marks on without ever being told.
          </p>
        </Card>
      </div>
    </div>
  );
}
