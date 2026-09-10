"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  StatusPill,
  Button,
  Empty,
  EventCard,
  EventMark,
  type EventTone,
  Input,
  PageHeader,
  cn,
} from "@/design-system";
import type {
  CurrentAffairsQuestion,
  OptionKey,
} from "@/features/current-affairs/types";

// Walked, not hashed: a topic vocabulary is open-ended, so a colour cannot honestly stand for one — it only keeps neighbours apart.
const OPEN_TONES: EventTone[] = ["info", "brand", "warn", "english", "ga"];

const KEYS: OptionKey[] = ["A", "B", "C", "D"];

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function CurrentAffairsView({
  day,
  today,
  questions,
}: {
  day: string;
  today: string;
  questions: CurrentAffairsQuestion[];
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<Record<string, OptionKey>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  const go = (target: string) => router.push(`/current-affairs?day=${target}`);
  const answered = questions.filter((q) => locked[q.id]);
  const correct = answered.filter((q) => picked[q.id] === q.answer).length;
  const atMax = day >= today;

  return (
    <div>
      <PageHeader
        title="Current affairs"
        sub="One grounded multiple-choice question per major story from the day's national and world news plus RBI, PIB and SEBI releases — each checked against its source before it reaches you."
        actions={
          <>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => go(shiftDay(day, -1))}
                className="rounded-pill border-line-2 text-ink-3 hover:border-ink/25 hover:text-ink grid size-10 place-items-center border transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <Input
                type="date"
                value={day}
                max={today}
                onChange={(e) => e.target.value && go(e.target.value)}
                className="tnum w-38"
              />
              <button
                type="button"
                aria-label="Next day"
                disabled={atMax}
                onClick={() => go(shiftDay(day, 1))}
                className="rounded-pill border-line-2 text-ink-3 hover:border-ink/25 hover:text-ink grid size-10 place-items-center border transition-colors disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {/* A score before anything is answered read "0 / 0 correct", which looks like a result. */}
            {questions.length > 0 ? (
              <span className="tnum text-ink-3 text-[14px]" aria-live="polite">
                {answered.length > 0
                  ? `${correct} of ${answered.length} right`
                  : `${questions.length} question${questions.length === 1 ? "" : "s"}`}
              </span>
            ) : null}
          </>
        }
      />

      {questions.length === 0 ? (
        <Empty
          title="Nothing generated for this day yet"
          sub="The pipeline runs once the evening news has settled, around 19:00 IST. Try an earlier date."
        />
      ) : (
        // Two up: a day of full-width questions is a scroll, not a survey.
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {questions.map((q, i) => {
            const isLocked = !!locked[q.id];
            const choice = picked[q.id];
            const right = isLocked && choice === q.answer;

            return (
              <EventCard
                key={q.id}
                kind={q.questionText}
                when={`Q${i + 1}`}
                tone={
                  isLocked
                    ? right
                      ? "ok"
                      : "bad"
                    : OPEN_TONES[i % OPEN_TONES.length]
                }
                mark={
                  <EventMark disc>
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  </EventMark>
                }
                footer={
                  isLocked ? (
                    <StatusPill
                      tone="live"
                      className={right ? "text-ok" : "text-bad"}
                    >
                      {right ? "Correct" : "Not quite"}
                    </StatusPill>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!choice}
                      onClick={() => setLocked((l) => ({ ...l, [q.id]: true }))}
                    >
                      Check answer
                    </Button>
                  )
                }
              >
                {q.topic ? (
                  <StatusPill tone="live" className="text-ink-2 mb-4">
                    {q.topic}
                  </StatusPill>
                ) : null}

                <div className="grid gap-2">
                  {KEYS.map((k) => {
                    const isAnswer = q.answer === k;
                    const isChoice = choice === k;
                    return (
                      // White paper on the panel: an option with only a border vanished into the card's own tint.
                      <button
                        key={k}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setPicked((p) => ({ ...p, [q.id]: k }))}
                        className={cn(
                          "bg-canvas rounded-ctl flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] leading-snug transition-shadow",
                          !isLocked && !isChoice && "hover:shadow-card",
                          !isLocked && isChoice && "shadow-card",
                          isLocked && isAnswer && "shadow-card",
                          isLocked && !isAnswer && !isChoice && "opacity-55",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-[7px] text-[12px] font-semibold",
                            isLocked && isAnswer
                              ? "bg-ok text-white"
                              : isLocked && isChoice
                                ? "bg-bad text-white"
                                : isChoice
                                  ? "bg-ink text-white"
                                  : "bg-panel text-ink-3",
                          )}
                        >
                          {k}
                        </span>
                        <span className="text-ink flex-1">{q.options[k]}</span>
                        {isLocked && isAnswer ? (
                          <Check size={15} className="text-ok shrink-0" />
                        ) : isLocked && isChoice ? (
                          <X size={15} className="text-bad shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {isLocked ? (
                  <p className="text-ink-2 mt-4 text-[13.5px] leading-relaxed">
                    {q.explanation}
                  </p>
                ) : null}
              </EventCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
