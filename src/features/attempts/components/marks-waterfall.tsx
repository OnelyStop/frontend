import { Card, SectionTitle } from "@/design-system";
import type { Scorecard } from "../types";

/** Colour means earned / lost / unclaimed and never section identity: the section tokens fail CVD separation, so every bar carries a label too. */
export function MarksWaterfall({ scorecard }: { scorecard: Scorecard }) {
  // Per-question marks/negativeMarks, not an assumed-uniform value — wrong and blank are separate bars (wrong also pays the penalty).
  let foregoneWrong = 0;
  let lostToNegative = 0;
  let foregoneBlank = 0;
  for (const q of scorecard.questions) {
    if (q.chosen === null) foregoneBlank += q.marks;
    else if (!q.isCorrect) {
      foregoneWrong += q.marks;
      lostToNegative += q.negativeMarks;
    }
  }

  const bars = [
    {
      label: "Maximum possible",
      value: scorecard.maxScore,
      tone: "neutral" as const,
    },
    {
      label: "You scored",
      value: scorecard.score,
      // A negative score (scoring.ts never clamps it) must not render as a solid green "good" bar.
      tone: scorecard.score >= 0 ? ("ok" as const) : ("bad" as const),
    },
    {
      label: "Given up to wrong answers",
      value: -foregoneWrong,
      tone: "bad" as const,
    },
    {
      label: "Lost extra to negative marking",
      value: -lostToNegative,
      tone: "bad" as const,
    },
    {
      label: "Left blank",
      value: -foregoneBlank,
      tone: "neutral" as const,
    },
  ];
  const scale = Math.max(scorecard.maxScore, 1);

  return (
    <Card>
      <SectionTitle aside={`${scorecard.score} / ${scorecard.maxScore}`}>
        Where the marks went
      </SectionTitle>
      <div className="mt-5 grid gap-4">
        {bars.map((b) => {
          const width = Math.min(100, (Math.abs(b.value) / scale) * 100);
          const barColor =
            b.tone === "ok"
              ? "bg-ok"
              : b.tone === "bad"
                ? "bg-bad"
                : "bg-ink-3";
          return (
            <div key={b.label}>
              <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                <span className="text-ink-2">{b.label}</span>
                <span className="tnum text-ink">
                  {b.value > 0 ? "+" : b.value < 0 ? "−" : ""}
                  {Math.abs(b.value).toFixed(2)}
                </span>
              </div>
              <div className="rounded-pill bg-line h-2 overflow-hidden">
                <div
                  className={`rounded-pill h-full ${barColor}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
