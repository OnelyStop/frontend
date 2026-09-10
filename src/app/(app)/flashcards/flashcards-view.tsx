"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Empty,
  EventCard,
  EventMark,
  type EventTone,
  PageHeader,
  StatusPill,
} from "@/design-system";
import type { CurrentAffairsQuestion } from "@/features/current-affairs/types";

// The deck was one face for every card; the tone walks so turning one reads as progress.
const FACE_TONES: EventTone[] = ["info", "brand", "warn", "ok", "english"];

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
  }, [done, shown]);

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
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* The stack behind visibly thins — that is the whole progress indicator. */}
          <div className="relative pt-3">
            <div
              className="bg-canvas/70 absolute inset-x-8 top-0 h-10 rounded-4xl"
              aria-hidden
            />
            <div
              className="bg-canvas absolute inset-x-4 top-1.5 h-10 rounded-4xl shadow-xs"
              aria-hidden
            />
            <EventCard
              kind={card!.questionText}
              when={shortDate(card!.day)}
              tone={FACE_TONES[i % FACE_TONES.length]!}
              className="relative"
              mark={
                <EventMark disc>
                  <span className="text-[11px] font-bold">{i + 1}</span>
                </EventMark>
              }
              footer={
                shown ? (
                  <Button
                    onClick={() => {
                      setShown(false);
                      setI((n) => n + 1);
                    }}
                  >
                    Next card
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setShown(true)}>
                    Reveal the answer
                  </Button>
                )
              }
            >
              {shown ? (
                // The answer is white paper on the panel, so revealing it is a change of surface, not just more text.
                <div className="bg-canvas rounded-ctl px-4 py-4">
                  <span className="text-ok text-[15px] font-semibold">
                    {card!.options[card!.answer]}
                  </span>
                  <p className="text-ink-2 mt-2 text-[13.5px] leading-relaxed">
                    {card!.explanation}
                  </p>
                </div>
              ) : (
                <p className="text-ink-3 py-6 text-center text-[13px]">
                  Press Space, or use the button below.
                </p>
              )}
            </EventCard>
          </div>

          <Card tone="plain" className="h-fit">
            <p className="text-ink-3 text-[13px]">Where you are</p>
            <p className="tnum mt-2 text-[28px] leading-none tracking-[-0.03em]">
              {i + 1}
              <span className="text-ink-3 text-[18px]">
                {" "}
                / {currentAffairs.length}
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {currentAffairs.map((c, n) => (
                <span
                  key={c.id}
                  aria-hidden
                  className={`h-1.5 flex-1 rounded-full ${n < i ? "bg-ok" : n === i ? "bg-ink" : "bg-ink/10"}`}
                />
              ))}
            </div>
            <div className="mt-5">
              <StatusPill tone="live" className="text-ink-2">
                Space reveals · Enter advances
              </StatusPill>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
