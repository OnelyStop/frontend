"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Button,
  ButtonLink,
  Empty,
  OptionRow,
  PageHeader,
  Segmented,
  StatusPill,
  TargetBar,
  cn,
  questionVariants,
} from "@/design-system";
import {
  NEGATIVE_MARK,
  SECTIONS,
  SECTION_DB,
  SECTION_LABEL,
  type Subject,
} from "@/data/navigation";
import { startMockAttempt, submitAttempt } from "@/features/attempts/actions";
import type { Mock } from "@/features/question-bank/types";
import type { DrillQuestion } from "@/features/question-bank/types";

const STAGES = ["All", "Prelims", "Mains"] as const;

type Recorded = { chosen: string | null; timeMs: number };
type SectionGroup = { subject: Subject; qs: DrillQuestion[] };

/** Only sections with answerable questions — a zero-question section must not land on the exam. */
function groupBySection(questions: DrillQuestion[]): SectionGroup[] {
  return SECTIONS.map((subject) => ({
    subject,
    qs: questions.filter((q) => q.section === SECTION_DB[subject]),
  })).filter((g) => g.qs.length > 0);
}

export function MocksView({ mocks }: { mocks: Mock[] }) {
  const router = useRouter();
  const { board } = useApp();
  const [stage, setStage] = useState<(typeof STAGES)[number]>("All");
  const [live, setLive] = useState<Mock | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  // Deadline, not a decrementing counter — a counter drifts under any main-thread block and hands back "free" time.
  const [sectionEndsAt, setSectionEndsAt] = useState(0);
  const [left, setLeft] = useState(0);
  const [secIdx, setSecIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Recorded>>({});
  const [qStart, setQStart] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startReqIdRef = useRef(0);

  const shown = mocks.filter((m) => stage === "All" || m.stage === stage);
  const sections = groupBySection(questions);
  const section = sections[secIdx];
  const q = section?.qs[qIdx];

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setLeft(Math.max(0, Math.round((sectionEndsAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [live, sectionEndsAt]);

  // The clock hitting 0 locks the section; React bails a same-value update so this fires exactly once at 0.
  useEffect(() => {
    if (!live || left > 0) return;
    void submitSectionOrFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submitSectionOrFinish deliberately isn't a dependency
  }, [left, live]);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      // Can't abandon mid-submit — a stale response could navigate to /results after the user already left.
      if (submitting) return;
      if (
        e.key === "Escape" &&
        confirm("Leave the mock? Your attempt is lost.")
      )
        setLive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, submitting]);

  // Resyncs the local pick from any recorded answer and restarts the stopwatch whenever the question changes.
  useEffect(() => {
    if (!q) return;
    const rec = answers[q.qId];
    const idx = rec?.chosen
      ? q.options.findIndex((o) => o.key === rec.chosen)
      : -1;
    setPicked(idx >= 0 ? idx : null);
    setQStart(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on q.qId only; `answers` would reset the timer on every keystroke
  }, [q?.qId]);

  function sectionDurationSec(groupCount: number): number {
    return Math.round((live?.mins ?? 0) / Math.max(1, groupCount)) * 60;
  }

  async function handleStart(m: Mock) {
    const reqId = ++startReqIdRef.current;
    setStarting(m.id);
    setError(null);
    const res = await startMockAttempt(m.id);
    // A later Start click fired while this request was in flight — let it win over this stale response.
    if (startReqIdRef.current !== reqId) return;
    setStarting(null);
    if (!("attemptId" in res)) {
      setError(res.error);
      return;
    }

    const groups = groupBySection(res.questions);
    const durationSec = Math.round(m.mins / Math.max(1, groups.length)) * 60;
    setQuestions(res.questions);
    setAttemptId(res.attemptId);
    setAnswers({});
    setSecIdx(0);
    setQIdx(0);
    setSectionEndsAt(Date.now() + durationSec * 1000);
    setLeft(durationSec);
    setLive(m);
  }

  function record(): Record<string, Recorded> {
    if (!q) return answers;
    const merged = {
      ...answers,
      [q.qId]: {
        chosen: picked !== null ? (q.options[picked]?.key ?? null) : null,
        timeMs: Date.now() - qStart,
      },
    };
    setAnswers(merged);
    return merged;
  }

  function goTo(nextSecIdx: number, nextQIdx: number, direction: 1 | -1) {
    record();
    setDir(direction);
    setSecIdx(nextSecIdx);
    setQIdx(nextQIdx);
  }

  async function submitSectionOrFinish() {
    const merged = record();
    if (secIdx < sections.length - 1) {
      const durationSec = sectionDurationSec(sections.length);
      setDir(1);
      setSecIdx(secIdx + 1);
      setQIdx(0);
      setSectionEndsAt(Date.now() + durationSec * 1000);
      setLeft(durationSec);
      return;
    }
    if (attemptId === null) {
      setLive(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    const submitted = questions.map((qq) => ({
      qId: qq.qId,
      chosen: merged[qq.qId]?.chosen ?? null,
      timeMs: merged[qq.qId]?.timeMs ?? null,
    }));
    const res = await submitAttempt(attemptId, submitted);
    if ("ok" in res) {
      router.push(`/results/${res.attemptId}`);
      return;
    }
    setSubmitting(false);
    setError(res.error);
  }

  // Exam conditions: the palette mirrors the real IBPS interface every aspirant already knows.
  if (live && q && section) {
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    const low = left < 60;
    const answered = section.qs.filter((sq) => answers[sq.qId]?.chosen).length;
    const onLastOfSection = qIdx === section.qs.length - 1;

    return (
      <div className="bg-canvas text-ink fixed inset-0 z-100 flex flex-col">
        <header className="border-line flex items-center gap-6 border-b px-8 py-4">
          <span className="text-[15px]">
            {live.name} {live.year}
            <span className="text-ink-3 ml-2">{live.stage}</span>
          </span>

          <span className="hidden items-center gap-1.5 lg:flex">
            {sections.map((s, i) => (
              <span
                key={s.subject}
                className={`rounded-pill px-2.5 py-1 text-[12.5px] transition-colors duration-150 ease-[var(--ease-swift)] ${
                  i === secIdx
                    ? "bg-ink text-white"
                    : i < secIdx
                      ? "text-ink-4 line-through"
                      : "text-ink-3"
                }`}
              >
                {SECTION_LABEL[s.subject]}
              </span>
            ))}
          </span>

          <span className="flex-1" />

          <span className="text-ink-3 text-[13px]">
            section {secIdx + 1} of {sections.length}
          </span>
          <span
            className={`tnum rounded-pill px-3 py-1 text-[20px] tracking-[-0.02em] transition-colors duration-150 ease-[var(--ease-swift)] ${
              low ? "bg-bad/15 text-bad" : "text-ink"
            }`}
          >
            {mm}:{ss}
          </span>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-8 py-12" data-lenis-prevent>
            <div className="mx-auto max-w-[680px]">
              {/* min-h so mode="wait" doesn't collapse the column to 0 between the outgoing and incoming question. */}
              <div className="relative min-h-[380px]">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={q.qId}
                    custom={dir}
                    variants={questionVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <p className="tnum text-ink-3 text-[13px]">
                      Question {qIdx + 1} of {section.qs.length} ·{" "}
                      {SECTION_LABEL[section.subject]}
                    </p>
                    {q.direction ? (
                      <p className="bg-canvas text-ink-2 ring-line mt-4 rounded-[14px] p-5 text-[16px] leading-relaxed ring-1">
                        {q.direction}
                      </p>
                    ) : null}
                    <p className="mt-4 text-[21px] leading-relaxed">{q.stem}</p>

                    <div className="mt-8 grid gap-2.5">
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

              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => goTo(secIdx, Math.max(0, qIdx - 1), -1)}
                  disabled={qIdx === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPicked(null);
                    setAnswers((prev) => ({
                      ...prev,
                      [q.qId]: { chosen: null, timeMs: Date.now() - qStart },
                    }));
                  }}
                >
                  Clear
                </Button>
                <span className="flex-1" />
                <Button
                  disabled={submitting}
                  onClick={() =>
                    onLastOfSection
                      ? void submitSectionOrFinish()
                      : goTo(secIdx, qIdx + 1, 1)
                  }
                >
                  {submitting
                    ? "Scoring…"
                    : onLastOfSection
                      ? secIdx < sections.length - 1
                        ? "Submit section and continue"
                        : "Finish paper"
                      : "Save & next"}
                </Button>
              </div>
            </div>
          </div>

          <aside className="border-line hidden w-[268px] shrink-0 flex-col border-l xl:flex">
            <div className="border-line border-b px-6 py-4">
              <p className="text-[14px]">Question palette</p>
              <p className="tnum text-ink-3 mt-1 text-[13px]">
                {answered} answered · {section.qs.length - answered} left
              </p>
            </div>
            <div
              className="grid flex-1 auto-rows-min grid-cols-6 gap-2 overflow-y-auto p-6"
              data-lenis-prevent
            >
              {section.qs.map((sq, i) => {
                const done =
                  Boolean(answers[sq.qId]?.chosen) ||
                  (i === qIdx && picked !== null);
                const here = i === qIdx;
                return (
                  <button
                    key={sq.qId}
                    onClick={() => goTo(secIdx, i, i > qIdx ? 1 : -1)}
                    className={`tnum grid size-8 place-items-center rounded-md text-[12.5px] transition-colors duration-150 ease-[var(--ease-swift)] ${
                      here
                        ? "bg-ink text-white"
                        : done
                          ? "bg-brand-soft text-brand"
                          : "bg-panel text-ink-3 hover:bg-line-2"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <footer className="border-line flex items-center gap-3 border-t px-8 py-4">
          <span className="text-ink-3 text-[13px]">
            {error ?? "Esc to leave"}
          </span>
          <span className="flex-1" />
          <Button
            variant="secondary"
            disabled={submitting}
            onClick={() => void submitSectionOrFinish()}
          >
            {submitting
              ? "Scoring…"
              : secIdx < sections.length - 1
                ? "Submit section and continue"
                : "Finish paper"}
          </Button>
        </footer>
      </div>
    );
  }

  return (
    <div data-companion>
      <PageHeader
        title="Mocks"
        sub={`Full ${board} papers under real sectional timing. Each section locks when its clock ends — same as the hall. Each paper's target is 55% of its questions — our benchmark, not the board's published cutoff.`}
        actions={
          <Segmented value={stage} options={STAGES} onChange={setStage} />
        }
      />

      {error ? <p className="text-bad mb-4 text-[13px]">{error}</p> : null}

      {mocks.length === 0 ? (
        <Empty
          title="No papers yet"
          sub="Past papers are imported into the question bank before they appear here. Drills pull from the same bank in the meantime."
          action={<ButtonLink href="/drills">Start a drill</ButtonLink>}
        />
      ) : shown.length === 0 ? (
        <Empty
          title={`No ${stage.toLowerCase()} papers`}
          sub="Nothing has been imported at this stage yet. Switch the filter to All to see everything there is."
        />
      ) : (
        // A ruled shelf, not a grid: it reads the same with one paper or thirty, and a paper has no colour of its own — only its verdict does.
        <div className="border-line border-t">
          {shown.map((m) => {
            const sat = m.score !== null;
            const cleared = m.score !== null && m.score >= m.target;
            return (
              <article
                key={m.id}
                className="border-line grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-4 border-b py-6 lg:grid-cols-[auto_minmax(0,1fr)_280px_auto] lg:gap-x-8"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-11 place-items-center rounded-full",
                    !sat
                      ? "bg-panel text-ink-3"
                      : cleared
                        ? "bg-ok-soft text-ok"
                        : "bg-bad-soft text-bad",
                  )}
                >
                  <FileText size={18} strokeWidth={2} />
                </span>

                <div className="min-w-0">
                  <h3 className="text-[18px] leading-tight font-semibold tracking-[-0.02em]">
                    {m.year ? `${m.name} ${m.year}` : m.name}
                  </h3>
                  <p className="tnum text-ink-3 mt-1 text-[13px]">
                    {m.stage} · {m.qs} questions · {m.mins} min · −
                    {NEGATIVE_MARK} a wrong answer
                  </p>
                </div>

                {/* The score is the only paper on the shelf, and it only exists once the paper has been sat. */}
                {m.score === null ? (
                  <p className="text-ink-3 col-start-2 text-[13px] lg:col-start-3">
                    Target is {m.target} — 55% of this paper&rsquo;s questions.
                  </p>
                ) : (
                  <div className="bg-canvas rounded-ctl shadow-card col-start-2 px-4 py-3.5 lg:col-start-3">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`tnum text-[22px] leading-none tracking-[-0.03em] ${cleared ? "text-ok" : "text-bad"}`}
                      >
                        {m.score}
                      </span>
                      <span className="text-ink-3 text-[13px]">
                        of {m.qs} · target {m.target}
                      </span>
                    </div>
                    <TargetBar
                      value={m.score}
                      target={m.target}
                      max={m.qs}
                      className="mt-3"
                    />
                  </div>
                )}

                <div className="col-start-2 flex items-center gap-2.5 lg:col-start-4">
                  <StatusPill
                    tone="live"
                    className={
                      !sat ? "text-ink-2" : cleared ? "text-ok" : "text-bad"
                    }
                  >
                    {!sat ? "Not attempted" : cleared ? "Cleared" : "Missed"}
                  </StatusPill>
                  <Button
                    size="sm"
                    disabled={starting !== null}
                    onClick={() => void handleStart(m)}
                  >
                    {starting === m.id ? "Loading…" : sat ? "Retake" : "Start"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
