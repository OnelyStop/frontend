"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/context/AppContext";
import {
  Button,
  Card,
  OptionRow,
  PageHeader,
  Segmented,
  questionVariants,
} from "@/design-system";
import { SECTIONS, SECTION_SHORT } from "@/data/navigation";
import type { Mock } from "@/features/question-bank/types";

/* Mocks. Sectional timing is the thing banking aspirants actually train for —
   each section locks when its clock runs out, and you cannot go back. */

const STAGES = ["All", "Prelims", "Mains"] as const;

export function MocksView({ mocks }: { mocks: Mock[] }) {
  const { board } = useApp();
  const [stage, setStage] = useState<(typeof STAGES)[number]>("All");
  const [live, setLive] = useState<Mock | null>(null);
  const [left, setLeft] = useState(0);
  const [secIdx, setSecIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const shown = mocks.filter((m) => stage === "All" || m.stage === stage);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirm("Leave the mock? Your attempt is lost."))
        setLive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live]);

  // Exam conditions: the app gets out of the way entirely. The question
  // palette on the right is the thing every Indian aspirant already knows from
  // the real IBPS interface — without it the screen reads as an empty void.
  if (live) {
    const secMins = Math.round(live.mins / SECTIONS.length);
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    const low = left < 60;
    const perSection = Math.round(live.qs / SECTIONS.length);
    const answered = Object.keys(picked).length;

    return (
      <div className="fixed inset-0 z-100 flex flex-col bg-canvas text-ink">
        <header className="flex items-center gap-6 border-b border-line px-8 py-4">
          <span className="text-[15px]">
            {live.name} {live.year}
            <span className="ml-2 text-ink-3">{live.stage}</span>
          </span>

          {/* Sections are locked in order, so they read as a track you are
              moving along, not as tabs you can pick from. */}
          <span className="hidden items-center gap-1.5 lg:flex">
            {SECTIONS.map((s, i) => (
              <span
                key={s}
                className={`rounded-pill px-2.5 py-1 text-[12.5px] transition-colors duration-150 ease-[var(--ease-swift)] ${
                  i === secIdx
                    ? "bg-ink text-white"
                    : i < secIdx
                      ? "text-ink-4 line-through"
                      : "text-ink-3"
                }`}
              >
                {SECTION_SHORT[s]}
              </span>
            ))}
          </span>

          <span className="flex-1" />

          <span className="text-[13px] text-ink-3">
            section {secIdx + 1} of {SECTIONS.length}
          </span>
          <span
            className={`tnum rounded-pill px-3 py-1 text-[24px] tracking-[-0.02em] transition-colors duration-150 ease-[var(--ease-swift)] ${
              low ? "bg-bad/15 text-bad" : "text-ink"
            }`}
          >
            {mm}:{ss}
          </span>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-8 py-12">
            <div className="mx-auto max-w-[680px]">
              {/* min-h so mode="wait" doesn't collapse the column to 0 in the
                  gap between the outgoing question unmounting and the next
                  one mounting. */}
              <div className="relative min-h-[380px]">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={`${secIdx}-${qIdx}`}
                    custom={dir}
                    variants={questionVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <p className="tnum text-[13px] text-ink-3">
                      Question {qIdx + 1} of {perSection} ·{" "}
                      {SECTION_SHORT[SECTIONS[secIdx]]}
                    </p>
                    <p className="mt-4 text-[21px] leading-relaxed">
                      A sum of ₹12,000 amounts to ₹15,120 in 2 years at simple
                      interest. What is the rate of interest per annum?
                    </p>

                    <div className="mt-8 grid gap-2.5">
                      {["11%", "12%", "13%", "14%"].map((o, i) => (
                        <OptionRow
                          key={o}
                          label={String.fromCharCode(65 + i)}
                          selected={picked[qIdx] === i}
                          onSelect={() => setPicked({ ...picked, [qIdx]: i })}
                        >
                          {o}
                        </OptionRow>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDir(-1);
                    setQIdx((n) => Math.max(0, n - 1));
                  }}
                  disabled={qIdx === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = { ...picked };
                    delete next[qIdx];
                    setPicked(next);
                  }}
                >
                  Clear
                </Button>
                <span className="flex-1" />
                <Button
                  onClick={() => {
                    setDir(1);
                    setQIdx((n) => Math.min(perSection - 1, n + 1));
                  }}
                >
                  Save &amp; next
                </Button>
              </div>
            </div>
          </div>

          <aside className="hidden w-[268px] shrink-0 flex-col border-l border-line xl:flex">
            <div className="border-b border-line px-6 py-4">
              <p className="text-[14px]">Question palette</p>
              <p className="tnum mt-1 text-[13px] text-ink-3">
                {answered} answered · {perSection - answered} left
              </p>
            </div>
            <div className="grid flex-1 auto-rows-min grid-cols-6 gap-2 overflow-y-auto p-6">
              {Array.from({ length: perSection }, (_, i) => {
                const done = picked[i] !== undefined;
                const here = i === qIdx;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setDir(i > qIdx ? 1 : -1);
                      setQIdx(i);
                    }}
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

        <footer className="flex items-center gap-3 border-t border-line px-8 py-4">
          <span className="text-[13px] text-ink-3">Esc to leave</span>
          <span className="flex-1" />
          <Button
            variant="secondary"
            onClick={() => {
              if (secIdx < SECTIONS.length - 1) {
                setDir(1);
                setSecIdx(secIdx + 1);
                setLeft(secMins * 60);
                setQIdx(0);
                setPicked({});
              } else setLive(null);
            }}
          >
            {secIdx < SECTIONS.length - 1
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
        sub={`Full ${board} papers under real sectional timing. Each section locks when its clock ends — same as the hall.`}
        actions={
          <Segmented value={stage} options={STAGES} onChange={setStage} />
        }
      />

      <div className="grid grid-cols-1 border-l border-t border-line lg:grid-cols-2">
        {shown.map((m) => {
          const cleared = m.score !== null && m.score >= m.cutoff;
          const scale = Math.max(m.cutoff, m.score ?? 0) * 1.3;
          return (
            <div
              key={m.id}
              className="relative flex items-start gap-4 border-b border-r border-line p-7 transition-colors duration-200 hover:bg-brand-soft/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[19px] tracking-[-0.02em]">
                  {m.name} {m.year}
                </p>
                <p className="tnum mt-1.5 text-[13px] text-ink-3">
                  {m.stage} · {m.qs} questions · {m.mins} min
                </p>

                <div className="mt-7 flex items-baseline gap-2">
                  <span
                    className={`tnum text-[26px] leading-none tracking-[-0.03em] ${
                      m.score === null ? "text-ink-4" : cleared ? "" : "text-bad"
                    }`}
                  >
                    {m.score ?? "—"}
                  </span>
                  <span className="text-[13px] text-ink-3">
                    {m.score === null
                      ? "not attempted"
                      : cleared
                        ? "cleared"
                        : "missed"}{" "}
                    · cutoff {m.cutoff}
                  </span>
                </div>

                {/* Same notch as Today: the cutoff, not the maximum, is what
                    the bar is read against. */}
                <div className="relative mt-3 h-1.5 rounded-pill bg-line">
                  {m.score !== null ? (
                    <div
                      className={`h-full rounded-pill ${cleared ? "bg-ink" : "bg-bad"}`}
                      style={{ width: `${(m.score / scale) * 100}%` }}
                    />
                  ) : null}
                  <span
                    className="absolute -top-1 h-[14px] w-px bg-ink-3"
                    style={{ left: `${(m.cutoff / scale) * 100}%` }}
                    aria-hidden
                  />
                </div>

                <span
                  aria-hidden
                  className="absolute bottom-[-2.5px] right-[-2.5px] size-[5px] rounded-full bg-ink-4"
                />
              </div>
              <button
                className="h-10 shrink-0 rounded-pill bg-ink px-5 text-[14px] font-medium text-white transition-colors hover:bg-ink/90"
                onClick={() => {
                  setLive(m);
                  setSecIdx(0);
                  setQIdx(0);
                  setPicked({});
                  setLeft(Math.round(m.mins / SECTIONS.length) * 60);
                }}
              >
                {m.score !== null ? "Retake" : "Start"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
