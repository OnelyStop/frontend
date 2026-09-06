"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/design-system";
import type { Scorecard } from "../types";

/** Cumulative score across the attempt, in question order. A single series
 * needs no legend — the title already names it — so this is the one chart
 * here that draws an actual line rather than divs, an inline `<svg
 * viewBox>` scaled to the container, which is the honest form for "trend
 * over time" per the form heuristic. 2px stroke, solid hairline gridlines. */
export function ScoreTimeline({ scorecard }: { scorecard: Scorecard }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const points = scorecard.timeline;
  if (points.length < 2) return null;

  const W = 600;
  const H = 220;
  const PAD = 24;
  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.cumulativeScore)));
  const yOf = (v: number) => H / 2 - (v / maxAbs) * (H / 2 - PAD);
  const xOf = (i: number) => (i / (points.length - 1)) * (W - PAD * 2) + PAD;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(p.cumulativeScore)}`)
    .join(" ");
  const finalScore = points[points.length - 1]!.cumulativeScore;
  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  // Each point's hit target spans to the midpoint with its neighbors (edge
  // points extend to the chart boundary) rather than a fixed W/N width at
  // its own position — a fixed width only tiles the chart with no gaps when
  // N is large; for N<=12 (any normal drill length) it leaves dead zones
  // between points with no hover response at all.
  const boundaries = [
    PAD,
    ...points.slice(1).map((_, i) => (xOf(i) + xOf(i + 1)) / 2),
    W - PAD,
  ];

  return (
    <Card>
      <SectionTitle aside={`ended at ${finalScore.toFixed(2)}`}>
        Score over the attempt
      </SectionTitle>
      <div className="relative mt-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: H }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Zero line and one gridline above/below — solid hairlines, never
              dashed (dashing reads as a projection, not a grid). */}
          <line
            x1={PAD}
            x2={W - PAD}
            y1={yOf(0)}
            y2={yOf(0)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          <line
            x1={PAD}
            x2={W - PAD}
            y1={yOf(maxAbs)}
            y2={yOf(maxAbs)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          <line
            x1={PAD}
            x2={W - PAD}
            y1={yOf(-maxAbs)}
            y2={yOf(-maxAbs)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />

          <path
            d={path}
            fill="none"
            stroke={finalScore >= 0 ? "var(--color-ok)" : "var(--color-bad)"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Wide invisible hit targets — a 2px line is far too thin to
              hover precisely, per the interaction spec's ≥24px minimum.
              Nearest-point partitioning (boundaries computed above), so
              coverage is gapless regardless of how many points there are. */}
          {points.map((p, i) => (
            <rect
              key={p.index}
              x={boundaries[i]}
              y={0}
              width={boundaries[i + 1]! - boundaries[i]!}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}
          {hovered ? (
            <circle
              cx={xOf(hoverIdx!)}
              cy={yOf(hovered.cumulativeScore)}
              r={4}
              fill={
                hovered.cumulativeScore >= 0
                  ? "var(--color-ok)"
                  : "var(--color-bad)"
              }
              stroke="var(--color-canvas)"
              strokeWidth={2}
            />
          ) : null}
        </svg>
        {hovered ? (
          <div className="bg-ink shadow-pop pointer-events-none absolute top-2 right-2 rounded-md px-2.5 py-1.5 text-[11px] text-white">
            <span className="tnum">
              Q{hovered.index} · {hovered.elapsedSec}s ·{" "}
              {hovered.cumulativeScore.toFixed(2)}
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
