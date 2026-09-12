"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  ActiveCard,
  Button,
  ButtonLink,
  Canvas,
  CornerBadge,
  Empty,
  OptionRow,
  PlanCard,
  SectionTitle,
  Segmented,
  Spine,
  SpineItem,
  StatusPill,
  Tile,
  questionVariants,
} from "@/design-system";
import {
  NEGATIVE_MARK,
  SECTIONS,
  SECTION_DB,
  SECTION_LABEL,
  type Subject,
} from "@/data/navigation";
import {
  advanceSection,
  checkpointSectionTime,
  saveAnswer,
  startMockAttempt,
  submitAttempt,
} from "@/features/attempts/actions";
import { SittingCard } from "@/features/attempts/components/SittingCard";
import type {
  ProfileStats,
  RecentAttempt,
} from "@/features/attempts/progress.server";
import { nextPaper, paperTitle } from "@/features/question-bank/next-paper";
import type { Mock } from "@/features/question-bank/types";
import type { DrillQuestion } from "@/features/question-bank/types";

const STAGES = ["All", "Prelims", "Mains"] as const;
// The hero card is outside this count — it's the one paper always shown regardless of page.
const PAGE_SIZE = 12;

type Recorded = { chosen: string | null; timeMs: number };
type SectionGroup = { subject: Subject; qs: DrillQuestion[] };

/** Only sections with answerable questions — a zero-question section must not land on the exam. */
function groupBySection(questions: DrillQuestion[]): SectionGroup[] {
  return SECTIONS.map((subject) => ({
    subject,
    qs: questions.filter((q) => q.section === SECTION_DB[subject]),
  })).filter((g) => g.qs.length > 0);
}

export function MocksView({
  mocks,
  stats,
  recent,
}: {
  mocks: Mock[];
  stats: ProfileStats | null;
  recent: RecentAttempt[];
}) {
  const router = useRouter();
  const { board } = useApp();
  const [stage, setStage] = useState<(typeof STAGES)[number]>("All");
  const [page, setPage] = useState(1);
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

  const shown = mocks.filter(
    (m) => m.name === board && (stage === "All" || m.stage === stage),
  );

  // The header board switcher is global state this view doesn't own, so it needs its own reset.
  useEffect(() => setPage(1), [board]);
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

  // Read through a ref, not the closure: qIdx/picked change on every question without rebinding this listener.
  const leaveRef = useRef(() => {});
  leaveRef.current = () => {
    record();
    if (attemptId !== null)
      void checkpointSectionTime(attemptId, sectionEndsAt - Date.now());
    setLive(null);
  };

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      // Can't abandon mid-submit — a stale response could navigate to /results after the user already left.
      if (submitting) return;
      if (e.key !== "Escape") return;
      if (
        confirm(
          "Leave the mock? Your progress is saved — resume it from Mocks whenever you come back.",
        )
      )
        leaveRef.current();
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
    const fullSectionSec = Math.round(m.mins / Math.max(1, groups.length)) * 60;
    setQuestions(res.questions);
    setAttemptId(res.attemptId);

    const resume = res.resume;
    const resumeIdx = resume
      ? groups.findIndex((g) => g.subject === resume.currentSection)
      : -1;
    // A resumed section that no longer exists (paper reimported differently) falls back to a fresh start.
    if (resume && resumeIdx !== -1) {
      const group = groups[resumeIdx]!;
      const firstUnanswered = group.qs.findIndex(
        (qq) => !resume.answers[qq.qId]?.chosen,
      );
      const remainingSec = Math.round(
        (resume.sectionRemainingMs ?? fullSectionSec * 1000) / 1000,
      );
      setAnswers(resume.answers);
      setSecIdx(resumeIdx);
      setQIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
      setSectionEndsAt(Date.now() + remainingSec * 1000);
      setLeft(remainingSec);
    } else {
      setAnswers({});
      setSecIdx(0);
      setQIdx(0);
      setSectionEndsAt(Date.now() + fullSectionSec * 1000);
      setLeft(fullSectionSec);
    }
    setLive(m);
  }

  function record(): Record<string, Recorded> {
    if (!q) return answers;
    const chosen = picked !== null ? (q.options[picked]?.key ?? null) : null;
    const timeMs = Date.now() - qStart;
    const merged = { ...answers, [q.qId]: { chosen, timeMs } };
    setAnswers(merged);
    // Fire-and-forget: an autosave failure shouldn't block the exam, and the final submit re-sends everything anyway.
    if (attemptId !== null) void saveAnswer(attemptId, q.qId, chosen, timeMs);
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
      if (attemptId !== null)
        void advanceSection(
          attemptId,
          sections[secIdx]!.subject,
          sections[secIdx + 1]!.subject,
        );
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

  const hero = nextPaper(shown);
  const rest = shown.filter((m) => m !== hero);
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const pageRest = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const heroCleared =
    hero !== null && hero.score !== null && hero.score >= hero.target;
  const lastSat = stats?.lastSatAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(stats.lastSatAt))
    : null;

  return (
    <div data-companion>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="text-[29px] leading-[1.14] font-bold tracking-[-0.03em]">
          Mocks
        </h1>
        <Segmented
          value={stage}
          options={STAGES}
          onChange={(s) => {
            setStage(s);
            setPage(1);
          }}
        />
      </div>

      {error ? <p className="text-bad mb-4 text-[13px]">{error}</p> : null}

      {mocks.length === 0 ? (
        <Empty
          title="No papers yet"
          sub="Past papers are imported into the question bank before they appear here. Drills pull from the same bank in the meantime."
          action={<ButtonLink href="/drills">Start a drill</ButtonLink>}
        />
      ) : shown.length === 0 ? (
        <Empty
          title={`No ${board} papers${stage === "All" ? "" : ` at ${stage}`}`}
          sub={
            stage === "All"
              ? "Nothing has been imported for this exam yet. Drills pull from the whole bank in the meantime."
              : "Nothing has been imported at this stage yet. Switch the filter to All to see everything there is for this exam."
          }
          action={
            stage === "All" ? (
              <ButtonLink href="/drills">Start a drill</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <Canvas
          aside={
            <>
              <SectionTitle aside="last 30 days">Your sittings</SectionTitle>
              <div className="mb-5 grid grid-cols-3 gap-2.5">
                <Tile
                  value={String(stats?.mocksSat ?? 0)}
                  label="papers sat"
                  tone="info"
                />
                <Tile
                  value={
                    stats?.bestScore === null || !stats
                      ? "—"
                      : String(stats.bestScore)
                  }
                  label="best score"
                  tone="ok"
                />
                <Tile value={lastSat ?? "—"} label="last sitting" outline />
              </div>
              {recent.length ? (
                <Spine>
                  {recent.map((s) => (
                    <SpineItem key={s.id}>
                      <SittingCard sitting={s} />
                    </SpineItem>
                  ))}
                </Spine>
              ) : (
                <p className="text-ink-3 text-[13px]">
                  Nothing submitted yet. Your sittings line up here.
                </p>
              )}
            </>
          }
        >
          {/* Its own row, capped to a card's width: sharing a grid row with a shorter PlanCard left dead space beneath it up to the hero's height, and going full column width would read as a banner instead of the one card picked up off the pile. */}
          <div>
            {hero ? (
              <ActiveCard
                tilt
                className="mb-4 max-w-xl"
                kicker={
                  hero.inProgress
                    ? "Sit next · paused partway"
                    : hero.score === null
                      ? "Sit next · not attempted"
                      : heroCleared
                        ? hero.score - hero.target < 3
                          ? "Sit next · you cleared it by a hair"
                          : "Sit next · cleared last time"
                        : "Sit next · missed last time"
                }
                title={paperTitle(hero)}
                resumeLabel={`${hero.inProgress ? "Resume" : hero.score === null ? "Start" : "Retake"} ${paperTitle(hero)}`}
                onResume={() => void handleStart(hero)}
                status={
                  hero.inProgress ? (
                    <StatusPill tone="warn">
                      Resume where you left off
                    </StatusPill>
                  ) : (
                    <>
                      <StatusPill tone="live">
                        {hero.score === null
                          ? `${hero.qs} questions · ${hero.mins} min`
                          : `Last sitting ${hero.score} of ${hero.qs}`}
                      </StatusPill>
                      <StatusPill tone="live">Target {hero.target}</StatusPill>
                    </>
                  )
                }
              >
                {hero.inProgress
                  ? "Your answers and the section clock are saved — pick up exactly where you paused."
                  : hero.score === null
                    ? `${hero.mins} minutes under real sectional timing — each section locks when its clock ends, same as the hall.`
                    : `${hero.qs} questions, ${hero.mins} minutes, each section locks when its clock ends — same as the hall.`}
              </ActiveCard>
            ) : null}
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            {pageRest.map((m) => {
              const sat = m.score !== null;
              const cleared = m.score !== null && m.score >= m.target;
              return (
                <PlanCard
                  key={m.id}
                  size="sm"
                  className="mb-0"
                  title={paperTitle(m)}
                  corner={
                    <CornerBadge
                      tone={!m.inProgress && sat && cleared ? "leaf" : "quiet"}
                    >
                      <FileText size={18} strokeWidth={1.75} />
                    </CornerBadge>
                  }
                  meta={
                    <span className="tnum">
                      {m.qs} questions · {m.mins} min · −{NEGATIVE_MARK} a wrong
                      answer
                    </span>
                  }
                  status={
                    <StatusPill
                      tone={
                        m.inProgress
                          ? "warn"
                          : !sat
                            ? "soon"
                            : cleared
                              ? "ok"
                              : "bad"
                      }
                    >
                      {m.inProgress
                        ? "In progress"
                        : !sat
                          ? "Not attempted"
                          : cleared
                            ? "Cleared"
                            : "Missed"}
                    </StatusPill>
                  }
                  actions={
                    <Button
                      size="sm"
                      disabled={starting !== null}
                      onClick={() => void handleStart(m)}
                    >
                      {starting === m.id
                        ? "Loading…"
                        : m.inProgress
                          ? "Resume"
                          : sat
                            ? "Retake"
                            : "Start"}
                    </Button>
                  }
                >
                  {m.inProgress
                    ? "Paused partway — your answers and the clock are saved."
                    : sat
                      ? `Last sitting ${m.score} of ${m.qs} — ${cleared ? "cleared" : "missed"} the ${m.target} target.`
                      : `Target is ${m.target} — 55% of the paper.`}
                </PlanCard>
              );
            })}
          </div>

          <p className="text-ink-3 mt-6 text-[12.5px] leading-relaxed">
            Full {board} papers under real sectional timing. Each paper&rsquo;s
            target is 55% of its questions — our benchmark, not the
            board&rsquo;s published cutoff.
          </p>

          {totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} strokeWidth={1.75} />
                Previous
              </Button>
              <span className="tnum text-ink-3 text-[13px]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight size={16} strokeWidth={1.75} />
              </Button>
            </div>
          ) : null}
        </Canvas>
      )}
    </div>
  );
}
