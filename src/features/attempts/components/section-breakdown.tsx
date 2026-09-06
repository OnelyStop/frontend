import { Card, SectionTitle } from "@/design-system";
import type { Scorecard } from "../types";

/** Section identity is carried by the row label, never by colour: the quant/reasoning tokens are ΔE 0.9 apart under protanopia. */
export function SectionBreakdown({ scorecard }: { scorecard: Scorecard }) {
  return (
    <Card>
      <SectionTitle
        aside={
          <span className="flex items-center gap-3 text-[12.5px]">
            <Swatch tone="ok" label="Correct" />
            <Swatch tone="bad" label="Wrong" />
            <Swatch tone="neutral" label="Skipped" />
          </span>
        }
      >
        Section breakdown
      </SectionTitle>
      <div className="mt-5 grid gap-4">
        {scorecard.sections.map((s) => {
          const total = s.correct + s.wrong + s.skipped;
          const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
          return (
            <div key={s.section}>
              <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                <span className="text-ink-2">{s.section}</span>
                <span className="tnum text-ink-3">
                  {s.correct}/{total} correct · +{s.marksEarned.toFixed(2)} / −
                  {s.marksLost.toFixed(2)}
                </span>
              </div>
              {/* 2px gap between segments, not a border, per the mark spec. */}
              <div className="flex h-6 gap-0.5 overflow-hidden rounded-md">
                <Segment pct={pct(s.correct)} tone="ok" value={s.correct} />
                <Segment pct={pct(s.wrong)} tone="bad" value={s.wrong} />
                <Segment
                  pct={pct(s.skipped)}
                  tone="neutral"
                  value={s.skipped}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Segment({
  pct,
  tone,
  value,
}: {
  pct: number;
  tone: "ok" | "bad" | "neutral";
  value: number;
}) {
  if (pct <= 0) return null;
  const bg = tone === "ok" ? "bg-ok" : tone === "bad" ? "bg-bad" : "bg-line-2";
  const text = tone === "neutral" ? "text-ink-3" : "text-white";
  return (
    <div
      className={`flex items-center justify-center text-[11px] font-medium ${bg} ${text}`}
      style={{ width: `${pct}%` }}
    >
      {/* The count only fits with its padding past ~10% of the row; narrower, it clips. */}
      {pct >= 10 ? value : null}
    </div>
  );
}

function Swatch({
  tone,
  label,
}: {
  tone: "ok" | "bad" | "neutral";
  label: string;
}) {
  const dot = tone === "ok" ? "bg-ok" : tone === "bad" ? "bg-bad" : "bg-line-2";
  return (
    <span className="text-ink-3 flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
