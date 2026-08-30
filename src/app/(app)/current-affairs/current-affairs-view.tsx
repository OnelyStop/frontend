"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge, Button, Card, Empty, Input, PageHeader, cn } from "@/design-system";

/* The daily current-affairs quiz. Questions come from the Gazette Engine
   pipeline (../backend) via the /api/current-affairs/daily proxy, one grounded
   MCQ per major story. This screen only reads and grades — nothing is generated
   here. Flashcards' "current affairs" deck is the untimed reveal loop; this is
   the dated set for the day. */

type OptionKey = "A" | "B" | "C" | "D";

type Question = {
  question_id: string;
  extracted_day: string;
  topic: string | null;
  question_text: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
};

type DailyResponse = { extracted_day: string; count: number; questions: Question[] };

const KEYS: OptionKey[] = ["A", "B", "C", "D"];

/* The pipeline anchors a question's day to when the news happened, in IST. */
function istToday(): string {
  return new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function CurrentAffairsView() {
  // null until mounted — new Date() on the server would risk a hydration
  // mismatch on the date control.
  const [day, setDay] = useState<string | null>(null);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; questions: Question[] }
  >({ kind: "loading" });
  const [picked, setPicked] = useState<Record<string, OptionKey>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  useEffect(() => setDay(istToday()), []);

  const load = useCallback(async (target: string) => {
    setState({ kind: "loading" });
    setPicked({});
    setLocked({});
    try {
      const res = await fetch(
        `/api/current-affairs/daily?extracted_day=${target}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as DailyResponse;
      setState({ kind: "ready", questions: data.questions });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    if (day) load(day);
  }, [day, load]);

  const ready = state.kind === "ready" ? state.questions : [];
  const answered = ready.filter((q) => locked[q.question_id]);
  const correct = answered.filter((q) => picked[q.question_id] === q.answer).length;
  const atMax = day != null && day >= istToday();

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
                disabled={!day}
                onClick={() => day && setDay(shiftDay(day, -1))}
                className="grid size-9 place-items-center rounded-pill border border-line-2 text-ink-3 transition-colors hover:border-ink/25 hover:text-ink disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <Input
                type="date"
                value={day ?? ""}
                max={istToday()}
                onChange={(e) => e.target.value && setDay(e.target.value)}
                className="tnum w-[9.5rem]"
              />
              <button
                type="button"
                aria-label="Next day"
                disabled={atMax}
                onClick={() => day && setDay(shiftDay(day, 1))}
                className="grid size-9 place-items-center rounded-pill border border-line-2 text-ink-3 transition-colors hover:border-ink/25 hover:text-ink disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {state.kind === "ready" && ready.length > 0 ? (
              <span className="tnum text-[14px] text-ink-3">
                {correct} / {answered.length} correct
                <span className="text-ink-4"> · {ready.length} today</span>
              </span>
            ) : null}
          </>
        }
      />

      {state.kind === "loading" ? (
        <p className="text-[14px] text-ink-3">Loading the day&rsquo;s questions…</p>
      ) : null}

      {state.kind === "error" ? (
        <Empty
          title="Couldn't load questions"
          sub={state.message}
          action={
            day ? (
              <Button variant="secondary" onClick={() => load(day)}>
                Try again
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {state.kind === "ready" && ready.length === 0 ? (
        <Empty
          title="Nothing generated for this day yet"
          sub="The pipeline runs once the evening news has settled, around 19:00 IST. Try an earlier date."
        />
      ) : null}

      {state.kind === "ready" && ready.length > 0 ? (
        <div className="space-y-4">
          {ready.map((q, i) => {
            const isLocked = !!locked[q.question_id];
            const choice = picked[q.question_id];
            const right = isLocked && choice === q.answer;

            return (
              <Card key={q.question_id} className="p-7">
                <div className="flex items-center gap-3">
                  <span className="tnum text-[13px] text-ink-4">Q{i + 1}</span>
                  {q.topic ? <Badge tone="brand">{q.topic}</Badge> : null}
                </div>

                <p className="mt-3 text-[19px] leading-snug tracking-[-0.02em]">
                  {q.question_text}
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
                        onClick={() =>
                          setPicked((p) => ({ ...p, [q.question_id]: k }))
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-ctl border px-4 py-3 text-left text-[14px] leading-snug transition-colors",
                          !isLocked && !isChoice && "border-line hover:border-ink/25",
                          !isLocked && isChoice && "border-brand bg-brand-soft",
                          isLocked && isAnswer && "border-ok bg-ok-soft",
                          isLocked && isChoice && !isAnswer && "border-bad bg-bad-soft",
                          isLocked && !isAnswer && !isChoice && "border-line opacity-60",
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
                          <Check size={15} className="shrink-0 text-ok" />
                        ) : isLocked && isChoice ? (
                          <X size={15} className="shrink-0 text-bad" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {isLocked ? (
                  <p className="mt-5 border-t border-line pt-4 text-[14px] leading-relaxed text-ink-2">
                    <span className={cn("font-medium", right ? "text-ok" : "text-bad")}>
                      {right ? "Correct." : "Not quite."}
                    </span>{" "}
                    {q.explanation}
                  </p>
                ) : (
                  <div className="mt-5">
                    <Button
                      size="sm"
                      disabled={!choice}
                      onClick={() =>
                        setLocked((l) => ({ ...l, [q.question_id]: true }))
                      }
                    >
                      Check answer
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
