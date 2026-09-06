"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Card, PageHeader, SectionTitle } from "@/design-system";
import type { Marking, SavedMarking } from "@/features/descriptive/marking";
import { TASKS, wordCount } from "@/features/descriptive/tasks";

const TOTAL_S = 30 * 60;
const MIN_WORDS = 20;

const ERRORS: Record<string, string> = {
  quota_exceeded:
    "You have used every marking on your plan this month. Upgrade, or come back next month — your drafts stay here.",
  rate_limited: "Too many markings in a row. Give it a minute.",
  not_configured: "Marking is unavailable right now. Nothing was counted.",
  answer_too_short: `Write at least ${MIN_WORDS} words before asking for a marking.`,
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function DescriptiveView({
  history,
  used,
  limit,
}: {
  history: SavedMarking[];
  used: number;
  limit: number | null;
}) {
  const { board } = useApp();
  const [idx, setIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [markings, setMarkings] = useState<Record<string, Marking>>(() =>
    // The newest marking per task, so a reload does not lose what a marking cost.
    history.reduce<Record<string, Marking>>(
      (acc, m) => (m.taskId in acc ? acc : { ...acc, [m.taskId]: m.marking }),
      {},
    ),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spent, setSpent] = useState(used);
  const [left, setLeft] = useState(TOTAL_S);
  const [running, setRunning] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const task = TASKS[idx]!;
  const draft = drafts[task.id] ?? "";
  const marking = markings[task.id];

  useEffect(() => {
    if (!running || left <= 0) return;
    const t = window.setInterval(
      () => setLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [running, left]);

  const words = useMemo(() => wordCount(draft), [draft]);

  const passed = useMemo(
    () => task.checks.map((c) => c.test(draft)),
    [draft, task],
  );

  // A band, not a hard cut: examiners tolerate overshoot better than a short answer.
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

  const outOfMarkings = limit !== null && spent >= limit;

  const start = () => {
    setRunning(true);
    areaRef.current?.focus();
  };

  const mark = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/descriptive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId: task.id, answer: draft }),
      });
      const data = (await res.json()) as {
        marking?: Marking;
        error?: string;
      };
      if (!res.ok || !data.marking) {
        setError(
          ERRORS[data.error ?? ""] ??
            "The marking did not come back. Nothing was counted against your allowance.",
        );
        return;
      }
      setMarkings((m) => ({ ...m, [task.id]: data.marking as Marking }));
      setSpent((n) => n + 1);
    } catch {
      setError("Could not reach the marker. Check your connection.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Descriptive"
        sub={`${board} Mains · one letter and one essay in 30 minutes. Most marks here are lost to format and length, not to ideas.`}
        actions={
          <>
            <span
              className={`tnum rounded-pill mr-1 px-3 py-1.5 text-[16px] ${
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
          <div className="rounded-pill border-line mb-6 inline-flex gap-1 border p-1">
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
          <p className="text-ink-2 mt-2 max-w-[72ch] text-[14px] leading-relaxed">
            {task.brief}
          </p>

          <textarea
            ref={areaRef}
            value={draft}
            onChange={(e) =>
              setDrafts({ ...drafts, [task.id]: e.target.value })
            }
            placeholder={
              task.kind === "Letter"
                ? "Sir / Madam,\n\nSubject: …"
                : "Write your essay here."
            }
            spellCheck={false}
            className="ruled border-line bg-canvas placeholder:text-ink-4 focus:border-brand focus:bg-canvas mt-5 min-h-[420px] w-full resize-y rounded-[14px] border px-4 py-3 text-[15px] transition-colors outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="tnum text-ink-3 text-[13px]">
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

            <span className="rounded-pill bg-line relative h-2 max-w-64 flex-1 overflow-hidden">
              <span
                className="bg-line-2 absolute inset-y-0"
                style={{
                  left: `${(task.min / (task.max * 1.4)) * 100}%`,
                  width: `${((task.max - task.min) / (task.max * 1.4)) * 100}%`,
                }}
                aria-hidden
              />
              <span
                className={`rounded-pill absolute inset-y-0 left-0 ${
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
              disabled={words < MIN_WORDS || pending || outOfMarkings}
              onClick={mark}
            >
              {pending ? "Marking…" : "Get it marked"}
            </Button>
          </div>

          <p className="text-ink-3 mt-3 text-[13px]">
            {outOfMarkings
              ? "No markings left this month."
              : limit === null
                ? `${spent} marked this month · unlimited on your plan`
                : `${spent} of ${limit} markings used this month`}
          </p>

          {error ? (
            <p className="bg-bad-soft text-bad mt-4 rounded-[12px] px-4 py-3 text-[13.5px] leading-relaxed">
              {error}
            </p>
          ) : null}

          {marking ? <MarkingCard marking={marking} /> : null}
        </Card>

        <Card className="h-fit">
          <SectionTitle
            aside={
              <span className="tnum text-ink-3 text-[13px]">
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
                      : "border-line-2 border text-transparent"
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
                    <span className="text-ink-3 mt-0.5 block text-[13px] leading-relaxed">
                      {c.hint}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <p className="border-line text-ink-3 mt-6 border-t pt-4 text-[13px] leading-relaxed">
            This list updates as you type and costs nothing. It only checks
            format — the marks come from the examiner, who reads what you
            actually argued.
          </p>
        </Card>
      </div>
    </div>
  );
}

function MarkingCard({ marking }: { marking: Marking }) {
  return (
    <div className="bg-canvas ring-line mt-5 rounded-[14px] p-5 ring-1">
      <div className="flex items-baseline gap-3">
        <span className="tnum text-2xl">
          {marking.total}
          <span className="text-ink-3">/{marking.outOf}</span>
        </span>
        <span className="text-ink-3 text-[13px]">examiner marking</span>
      </div>

      <p className="text-ink-2 mt-3 max-w-[70ch] text-[14px] leading-relaxed">
        {marking.verdict}
      </p>

      <dl className="border-line mt-5 grid gap-3 border-t pt-4">
        {marking.bands.map((b) => (
          <div key={b.id} className="grid gap-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-[14px]">{b.label}</span>
              <span className="flex-1" />
              <span className="tnum text-[14px]">
                {b.awarded}
                <span className="text-ink-3">/{b.outOf}</span>
              </span>
            </div>
            <div className="rounded-pill bg-line h-1.5 overflow-hidden">
              <div
                className="rounded-pill bg-ink h-full"
                style={{ width: `${b.score}%` }}
              />
            </div>
            <p className="text-ink-3 text-[13px] leading-relaxed">
              {b.comment}
            </p>
          </div>
        ))}
      </dl>

      {marking.strengths.length > 0 ? (
        <div className="border-line mt-5 border-t pt-4">
          <p className="text-ink-2 text-[13px] font-medium">Keep doing</p>
          <ul className="text-ink-3 mt-2 grid gap-1.5 text-[13px] leading-relaxed">
            {marking.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {marking.fixes.length > 0 ? (
        <div className="border-line mt-5 border-t pt-4">
          <p className="text-ink-2 text-[13px] font-medium">Fix these first</p>
          <ul className="mt-3 grid gap-4">
            {marking.fixes.map((f, i) => (
              <li key={i} className="grid gap-1.5">
                {f.quote ? (
                  <q className="text-ink-3 border-line border-l-2 pl-3 text-[13px] leading-relaxed italic">
                    {f.quote}
                  </q>
                ) : null}
                <p className="text-ink-2 text-[13px] leading-relaxed">
                  {f.problem}
                </p>
                <p className="text-ok text-[13px] leading-relaxed">
                  {f.rewrite}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
