"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  PageHeader,
  cn,
} from "@/design-system";
import type {
  CurrentAffairsQuestion,
  OptionKey,
} from "@/features/current-affairs/types";

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
                className="rounded-pill border-line-2 text-ink-3 hover:border-ink/25 hover:text-ink grid size-9 place-items-center border transition-colors"
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
                className="rounded-pill border-line-2 text-ink-3 hover:border-ink/25 hover:text-ink grid size-9 place-items-center border transition-colors disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {questions.length > 0 ? (
              <span className="tnum text-ink-3 text-[14px]">
                {correct} / {answered.length} correct
                <span className="text-ink-4"> · {questions.length} today</span>
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
        <div className="space-y-4">
          {questions.map((q, i) => {
            const isLocked = !!locked[q.id];
            const choice = picked[q.id];
            const right = isLocked && choice === q.answer;

            return (
              <Card key={q.id} className="p-7">
                <div className="flex items-center gap-3">
                  <span className="tnum text-ink-4 text-[13px]">Q{i + 1}</span>
                  {q.topic ? <Badge tone="brand">{q.topic}</Badge> : null}
                </div>

                <p className="mt-3 text-[19px] leading-snug tracking-[-0.02em]">
                  {q.questionText}
                </p>

                <div className="mt-5 grid gap-2">
                  {KEYS.map((k) => {
                    const isAnswer = q.answer === k;
                    const isChoice = choice === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setPicked((p) => ({ ...p, [q.id]: k }))}
                        className={cn(
                          "rounded-ctl flex w-full items-center gap-3 border px-4 py-3 text-left text-[14px] leading-snug transition-colors",
                          !isLocked &&
                            !isChoice &&
                            "border-line hover:border-ink/25",
                          !isLocked && isChoice && "border-brand bg-brand-soft",
                          isLocked && isAnswer && "border-ok bg-ok-soft",
                          isLocked &&
                            isChoice &&
                            !isAnswer &&
                            "border-bad bg-bad-soft",
                          isLocked &&
                            !isAnswer &&
                            !isChoice &&
                            "border-line opacity-60",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-[7px] text-[12px]",
                            isLocked && isAnswer
                              ? "bg-ok text-white"
                              : isLocked && isChoice
                                ? "bg-bad text-white"
                                : isChoice
                                  ? "bg-brand text-white"
                                  : "bg-panel text-ink-3",
                          )}
                        >
                          {k}
                        </span>
                        <span className="flex-1">{q.options[k]}</span>
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
                  <p className="border-line text-ink-2 mt-5 border-t pt-4 text-[14px] leading-relaxed">
                    <span
                      className={cn(
                        "font-medium",
                        right ? "text-ok" : "text-bad",
                      )}
                    >
                      {right ? "Correct." : "Not quite."}
                    </span>{" "}
                    {q.explanation}
                  </p>
                ) : (
                  <div className="mt-5">
                    <Button
                      size="sm"
                      disabled={!choice}
                      onClick={() => setLocked((l) => ({ ...l, [q.id]: true }))}
                    >
                      Check answer
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
