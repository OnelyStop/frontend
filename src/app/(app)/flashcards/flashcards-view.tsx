"use client";

import { useEffect, useState } from "react";
import { Button, Card, Empty, PageHeader } from "@/design-system";
import type { CurrentAffairsQuestion } from "@/features/current-affairs/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Formatted by hand because toLocaleDateString follows the runtime locale, which differs across the hydration boundary.
function shortDate(day: string): string {
  const [, month, date] = day.split("-");
  return `${Number(date)} ${MONTHS[Number(month) - 1]}`;
}

export function FlashcardsView({
  currentAffairs,
  currentAffairsDays,
}: {
  currentAffairs: CurrentAffairsQuestion[];
  currentAffairsDays: number;
}) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  const done = i >= currentAffairs.length;
  const card = done ? null : currentAffairs[i];

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setShown(true);
        return;
      }
      if (shown && (e.key === "Enter" || e.key === "ArrowRight")) {
        setShown(false);
        setI((n) => n + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const restart = () => {
    setShown(false);
    setI(0);
  };

  const sub = `The last ${currentAffairsDays} days of current-affairs questions — the window GA asks from. Reveal with Space. Nothing is scheduled: the list is whatever the evening run has written.`;

  if (currentAffairs.length === 0) {
    return (
      <div>
        <PageHeader title="Flashcards" sub={sub} />
        <Empty
          title="Nothing to review yet"
          sub="The evening run writes one question per major story. Once it has run, the last few days appear here."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Flashcards"
        sub={sub}
        actions={
          <span className="tnum text-ink-3 mr-1 text-[14px]">
            {done ? "done" : `${i + 1} of ${currentAffairs.length}`}
          </span>
        }
      />

      {done ? (
        <Card className="max-w-2xl p-12 text-center">
          <p className="text-[22px] tracking-[-0.02em]">End of the list</p>
          <p className="text-ink-3 mx-auto mt-3 max-w-[42ch] text-[14px] leading-relaxed">
            {currentAffairs.length} questions reviewed. There is no review
            schedule — go again now, or come back once the run has added more.
          </p>
          <div className="mt-8 flex justify-center">
            <Button onClick={restart}>Start again</Button>
          </div>
        </Card>
      ) : (
        <>
          {/* The stack visibly thins — that is the whole progress indicator. */}
          <div className="relative max-w-2xl">
            <div className="rounded-t-card border-line absolute inset-x-6 -top-3 h-6 border" />
            <div className="rounded-t-card border-line bg-canvas absolute inset-x-3 -top-1.5 h-6 border" />
            <button
              className="card hover:bg-brand-soft/40 relative w-full p-10 text-left transition-colors duration-200"
              onClick={() => setShown(true)}
            >
              <span className="tnum text-ink-4 text-[13px]">
                {shortDate(card!.day)}
              </span>
              <p className="mt-4 text-[24px] leading-snug tracking-[-0.02em]">
                {card!.questionText}
              </p>
              {shown ? (
                <p className="border-line text-ink-2 mt-6 border-t pt-6 text-[16px] leading-relaxed">
                  {card!.options[card!.answer]} — {card!.explanation}
                </p>
              ) : (
                <p className="text-ink-4 mt-8 text-[13px]">
                  Click or press Space to reveal
                </p>
              )}
            </button>
          </div>

          {shown ? (
            <div className="mt-6 flex max-w-2xl gap-2.5">
              <Button
                onClick={() => {
                  setShown(false);
                  setI((n) => n + 1);
                }}
              >
                Next card
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
