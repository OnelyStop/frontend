"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/context/AppContext";
import {
  Button,
  Card,
  EventCard,
  EventMark,
  type EventTone,
  OptionRow,
  PageHeader,
  SECTION_TINT,
  SectionTitle,
  StatusPill,
  cn,
  questionVariants,
} from "@/design-system";
import {
  SECTIONS,
  SECTION_DB,
  SECTION_KEY,
  SECTION_LABEL,
  type Subject,
} from "@/data/navigation";
import { startAttempt, submitAttempt } from "@/features/attempts/actions";
import type { DrillQuestion } from "@/features/question-bank/types";

const LENGTHS = [10, 20, 30] as const;
/* The pace the drill is budgeted at, and what the readout counts against. */
const SECONDS_PER_Q = 45;

/* Positional, in SECTIONS order, so a section keeps its own colour across the app. */
const SECTION_EVENT_TONE: EventTone[] = [
  "quant",
  "reasoning",
  "english",
  "ga",
  "computer",
];

type Recorded = { chosen: string | null; timeMs: number };

export function DrillsView({ pool }: { pool: DrillQuestion[] }) {
  const router = useRouter();
  const { board } = useApp();
  const [section, setSection] = useState<Subject>(SECTIONS[2]);
  const [len, setLen] = useState<(typeof LENGTHS)[number]>(20);
  const [running, setRunning] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Recorded>>({});
  const [qStart, setQStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sat, setSat] = useState<DrillQuestion[]>([]);
  const startReqIdRef = useRef(0);

  const mins = Math.round((len * SECONDS_PER_Q) / 60);
  const fill = SECTION_TINT[SECTIONS.indexOf(section)]!;
  // Amber from three quarters of the budget, red past it; nothing is coloured while on pace.
  const over = elapsed > SECONDS_PER_Q;
  const near = !over && elapsed >= SECONDS_PER_Q * 0.75;
  const pick = (from: DrillQuestion[]) =>
    from.filter((q) => q.section === SECTION_DB[section]).slice(0, len);
  // Counted per section rather than for the selected one, so every card can say what is behind it.
  const poolFor = (s: Subject) =>
    pool.filter((q) => q.section === SECTION_DB[s]).length;

  // Before the drill starts this previews the page's pool; once running it is the set the server recorded.
  const set = running ? sat : pick(pool);
  const q = set[qIdx];

  // Reads the same `qStart` that is submitted as timeMs, so the readout cannot drift from the recorded time.
  useEffect(() => {
    if (!running) return;
    setElapsed(0);
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - qStart) / 1000)),
      500,
    );
    return () => clearInterval(t);
  }, [running, qStart]);

  async function start() {
    const reqId = ++startReqIdRef.current;
    setQIdx(0);
    setPicked(null);
    setAnswers({});
    setAttemptId(null);
    setError(null);
    setQStart(Date.now());
    // The server picks the questions and records them; grading accepts no others.
    const res = await startAttempt("bank", null);
    // A later start() call before this resolved should win, not this stale response.
    if (startReqIdRef.current !== reqId) return;
    if (!("attemptId" in res)) {
      setError(res.error);
      return;
    }
    setAttemptId(res.attemptId);
    setSat(pick(res.questions));
    setQStart(Date.now());
    setRunning(true);
  }

  // Folds the pick into a local `merged` value (not `answers`, stale until next render) that both branches act on.
  function recordAndProceed(action: "advance" | "finish") {
    if (!q) return;
    const merged: Record<string, Recorded> = {
      ...answers,
      [q.qId]: {
        chosen: picked !== null ? (q.options[picked]?.key ?? null) : null,
        timeMs: Date.now() - qStart,
      },
    };
    setAnswers(merged);
    if (action === "advance") {
      setQIdx((i) => Math.min(set.length - 1, i + 1));
      setPicked(null);
      setQStart(Date.now());
    } else {
      void finish(merged);
    }
  }

  async function finish(merged: Record<string, Recorded>) {
    if (attemptId === null) {
      setRunning(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    const submitted = set.map((sq) => ({
      qId: sq.qId,
      chosen: merged[sq.qId]?.chosen ?? null,
      timeMs: merged[sq.qId]?.timeMs ?? null,
    }));
    const res = await submitAttempt(attemptId, submitted);
    if ("ok" in res) {
      router.push(`/results/${res.attemptId}`);
      return;
    }
    setSubmitting(false);
    setError(res.error);
  }

  if (running && q) {
    return (
      <div>
        <PageHeader
          title={`${SECTION_LABEL[section]} drill`}
          sub={`Question ${qIdx + 1} of ${set.length}`}
          actions={
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={() => setRunning(false)}
            >
              End drill
            </Button>
          }
        />

        <Card className={cn("p-6", fill)}>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-pill bg-canvas h-1.5 flex-1 overflow-hidden">
              <div
                className={cn(
                  "rounded-pill h-full",
                  over ? "bg-bad" : near ? "bg-warn" : "bg-ok",
                )}
                style={{
                  width: `${Math.min(100, (elapsed / SECONDS_PER_Q) * 100)}%`,
                }}
              />
            </div>
            <StatusPill tone={over ? "bad" : near ? "warn" : "live"}>
              <span className="tnum">
                {elapsed}s / {SECONDS_PER_Q}s
              </span>
            </StatusPill>
          </div>

          {/* min-h so mode="wait" doesn't collapse the card to 0 between the outgoing and incoming question. */}
          <div className="relative min-h-[280px]">
            <AnimatePresence mode="wait" custom={1}>
              <motion.div
                key={qIdx}
                custom={1}
                variants={questionVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {q.direction ? (
                  <p className="bg-canvas text-ink-2 ring-line mt-4 rounded-[14px] p-5 text-[16px] leading-relaxed ring-1">
                    {q.direction}
                  </p>
                ) : null}
                <p className="text-[17px] leading-relaxed">{q.stem}</p>

                <div className="mt-5 grid gap-2.5">
                  {q.options.map((o, i) => (
                    <OptionRow
                      key={o.key}
                      label={o.key.toUpperCase()}
                      selected={picked === i}
                      onSelect={() => setPicked(i)}
                    >
                      {o.text}
                    </OptionRow>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-line mt-6 flex items-center gap-3 border-t pt-5">
            {qIdx < set.length - 1 ? (
              <Button
                disabled={picked === null}
                onClick={() => recordAndProceed("advance")}
              >
                Submit answer
              </Button>
            ) : (
              <Button
                disabled={picked === null || submitting}
                onClick={() => recordAndProceed("finish")}
              >
                {submitting ? "Scoring…" : "Finish drill"}
              </Button>
            )}
            {error ? (
              <span className="text-bad text-[13px]">{error}</span>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${len} questions · ${SECTION_LABEL[section]} · ${mins} min`}
        sub={`A random set from the ${board} question bank. Change anything, or just start.`}
        actions={
          <Button disabled={set.length === 0} onClick={() => void start()}>
            Start drill
          </Button>
        }
      />

      <SectionTitle aside={`drawn at random · ${SECONDS_PER_Q}s a question`}>
        What do you want to drill?
      </SectionTitle>

      {/* The card IS the choice: a row of identical pills made the section an afterthought rather than the decision. */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => {
          const poolSize = poolFor(s);
          const chosen = section === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              aria-pressed={chosen}
              className="rounded-4xl text-left transition-transform focus-visible:outline-2"
            >
              <EventCard
                kind={SECTION_LABEL[s]}
                when={`${poolSize} in pool`}
                tone={SECTION_EVENT_TONE[SECTIONS.indexOf(s)]!}
                className={cn(
                  "h-full",
                  chosen ? "shadow-pop" : "opacity-70 hover:opacity-100",
                )}
                mark={
                  <EventMark disc>
                    <i
                      className="size-2.5 rounded-full"
                      style={{
                        background: `var(--color-${SECTION_KEY[s]})`,
                      }}
                    />
                  </EventMark>
                }
                footer={
                  <StatusPill
                    tone="live"
                    className={chosen ? "text-ink" : "text-ink-3"}
                  >
                    {chosen ? "Selected" : "Choose"}
                  </StatusPill>
                }
              >
                {poolSize === 0 ? (
                  "Nothing in the bank for this section yet."
                ) : (
                  <>
                    <span className="tnum text-ink block text-[26px] leading-none tracking-[-0.03em]">
                      {Math.min(len, poolSize)}
                    </span>
                    <span className="mt-1.5 block text-[13px]">
                      questions this drill would draw
                      {poolSize < len ? ` — all ${poolSize} there are` : ""}
                    </span>
                  </>
                )}
              </EventCard>
            </button>
          );
        })}
      </div>

      <Card tone="plain">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-ink-3 w-20 shrink-0 text-[13px]">Length</span>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((l) => (
              <Pick key={l} on={len === l} onClick={() => setLen(l)}>
                {l} questions · {Math.round((l * SECONDS_PER_Q) / 60)} min
              </Pick>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Pick({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`press tnum rounded-ctl h-9 border px-4 text-[13px] font-medium transition-colors duration-150 ease-[var(--ease-swift)] ${
        on
          ? "border-ink bg-ink text-white"
          : "border-line bg-canvas text-ink-2 hover:border-line-2"
      }`}
    >
      {children}
    </button>
  );
}
