"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/context/AppContext";
import {
  Button,
  Card,
  OptionRow,
  PageHeader,
  SectionTitle,
  questionVariants,
} from "@/design-system";
import {
  SECTIONS,
  SECTION_DB,
  SECTION_LABEL,
  type Subject,
} from "@/data/navigation";
import { startAttempt, submitAttempt } from "@/features/attempts/actions";
import type { DrillQuestion } from "@/features/question-bank/types";

const LENGTHS = [10, 20, 30] as const;
const MODES = ["Weak topics", "Speed", "Mixed"] as const;

type Recorded = { chosen: string | null; timeMs: number };

export function DrillsView({ pool }: { pool: DrillQuestion[] }) {
  const router = useRouter();
  const { board } = useApp();
  const [section, setSection] = useState<Subject>(SECTIONS[2]);
  const [len, setLen] = useState<(typeof LENGTHS)[number]>(20);
  const [mode, setMode] = useState<(typeof MODES)[number]>("Weak topics");
  const [running, setRunning] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Recorded>>({});
  const [qStart, setQStart] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startReqIdRef = useRef(0);

  const mins = Math.round((len * 45) / 60);
  // "Weak topics"/"Speed"/"Mixed" don't change the pool yet — none of them
  // have attempt data to aim at (see attempts/user_topic_stats in
  // src/db/schema.ts: created, but nothing writes them until scoring lands).
  const set = pool
    .filter((q) => q.section === SECTION_DB[section])
    .slice(0, len);
  const q = set[qIdx];

  async function start() {
    const reqId = ++startReqIdRef.current;
    setQIdx(0);
    setPicked(null);
    setAnswers({});
    setAttemptId(null);
    setError(null);
    setQStart(Date.now());
    setRunning(true);
    // Grading needs a row to attach answers to. If this fails (signed out,
    // offline), the drill still runs locally — finishing just can't be
    // scored or saved, the same experience this page always had.
    const res = await startAttempt("bank", null);
    // Ending this drill and starting another before this resolved would
    // otherwise let this stale response overwrite the new session's id.
    if (startReqIdRef.current !== reqId) return;
    if ("attemptId" in res) setAttemptId(res.attemptId);
    else setError(res.error);
  }

  // Folds the current pick into the answers map and either steps to the next
  // question or, on the last one, submits everything gathered so far. A
  // local `merged` value (not the `answers` state, which won't have this
  // update applied until the next render) is what both branches act on.
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
          sub={`Question ${qIdx + 1} of ${set.length} · ${mode.toLowerCase()}`}
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

        <Card className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-pill bg-line h-1.5 flex-1 overflow-hidden">
              <div className="rounded-pill bg-brand h-full w-1/4" />
            </div>
            <span className="tnum text-ink-3 text-[13px]">11s / 45s</span>
          </div>

          {/* min-h so mode="wait" doesn't collapse the card to 0 in the gap
              between the outgoing question unmounting and the next mounting. */}
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
        sub={`Already aimed at the topics costing you marks in ${board}. Change anything, or just start.`}
        actions={
          <Button disabled={set.length === 0} onClick={() => void start()}>
            Start drill
          </Button>
        }
      />

      <Card>
        <SectionTitle>Set up</SectionTitle>
        <div className="grid gap-5">
          <Field label="Section">
            {SECTIONS.map((s) => (
              <Pick key={s} on={section === s} onClick={() => setSection(s)}>
                {SECTION_LABEL[s]}
              </Pick>
            ))}
          </Field>
          <Field label="Length">
            {LENGTHS.map((l) => (
              <Pick key={l} on={len === l} onClick={() => setLen(l)}>
                {l}
              </Pick>
            ))}
          </Field>
          <Field label="Aim">
            {MODES.map((m) => (
              <Pick key={m} on={mode === m} onClick={() => setMode(m)}>
                {m}
              </Pick>
            ))}
          </Field>
        </div>

        <p className="border-line text-ink-3 mt-6 border-t pt-4 text-[13px] leading-relaxed">
          {set.length === 0
            ? `No ${SECTION_LABEL[section]} questions in the pool right now.`
            : "Weak topics pulls from the bottom-left of your attempt map. Speed keeps the accuracy you have and cuts the clock."}
        </p>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-ink-3 w-20 shrink-0 text-[13px]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
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
