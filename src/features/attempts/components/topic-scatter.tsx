"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/design-system";
import type { Scorecard } from "../types";

// Same coordinate mappers as /attempt-map, reused deliberately so a topic lands where the reader already expects it.
const PAD = 7;
const MAX_SEC = 90;
const x = (sec: number) => PAD + Math.min(1, sec / MAX_SEC) * (100 - PAD * 2);
const y = (acc: number) => PAD + (acc / 100) * (100 - PAD * 2);
const X_TICKS = [0, 30, 60, 90];
const Y_TICKS = [0, 25, 50, 75, 100];

// Past this threshold a centered tooltip clips the plot's overflow-hidden edge — anchor to the dot's edge instead.
const EDGE_PCT = 20;

/** One dot per topic touched in this attempt. Colour still isn't section
 * identity (see marks-waterfall's comment) — every dot is either ok or bad
 * by accuracy, and only the "skip in the exam" quadrant wash plus the topic
 * label carry meaning, matching the emphasis form: one thing to notice, not
 * eight hues to decode. */
export function TopicScatter({ scorecard }: { scorecard: Scorecard }) {
  const [hover, setHover] = useState<string | null>(null);
  const topics = scorecard.topics.filter((t) => t.attempted > 0);

  return (
    <Card>
      <SectionTitle aside={`${topics.length} topics touched`}>
        Accuracy vs pace, by topic
      </SectionTitle>
      <div className="mt-5 flex gap-2">
        {/* Absolutely positioned at the same y(v) the gridlines use, inside a
            container the same 280px height as the plot — flex-distributing
            these instead (the previous approach) can't line up with PAD's
            symmetric top/bottom coordinate padding, since CSS percentage
            padding resolves against the container's width, never its own
            height. */}
        <div className="text-ink-4 relative h-[280px] w-9 text-right text-[11px]">
          {Y_TICKS.map((v) => (
            <span
              key={v}
              className="absolute right-0 -translate-y-1/2"
              style={{ bottom: `${y(v)}%` }}
            >
              {v}%
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div
            className="inset-panel relative h-[280px] overflow-hidden"
            onMouseLeave={() => setHover(null)}
          >
            {Y_TICKS.map((v) => (
              <span
                key={`gy${v}`}
                className="bg-line absolute inset-x-0 h-px"
                style={{ bottom: `${y(v)}%` }}
                aria-hidden
              />
            ))}
            {X_TICKS.map((v) => (
              <span
                key={`gx${v}`}
                className="bg-line absolute inset-y-0 w-px"
                style={{ left: `${x(v)}%` }}
                aria-hidden
              />
            ))}
            {/* Skip-in-the-exam quadrant: slow and inaccurate. */}
            <span
              className="bg-bad/[0.05] absolute"
              style={{
                left: `${x(45)}%`,
                right: 0,
                bottom: 0,
                top: `${100 - y(50)}%`,
              }}
              aria-hidden
            />

            {topics.map((t) => {
              const key = `${t.section}::${t.topic}`;
              const isHover = hover === key;
              const r = Math.max(14, Math.min(30, 10 + t.attempted * 3));
              const xPct = x(t.avgTimeSec);
              const anchor =
                xPct < EDGE_PCT
                  ? "left"
                  : xPct > 100 - EDGE_PCT
                    ? "right"
                    : "center";
              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setHover(key)}
                  onFocus={() => setHover(key)}
                  className="group absolute z-20 -translate-x-1/2 translate-y-1/2"
                  style={{ left: `${xPct}%`, bottom: `${y(t.accuracy)}%` }}
                >
                  <span
                    className={`block rounded-full ring-4 ${
                      isHover ? "scale-125 ring-8" : ""
                    } ${t.accuracy >= 60 ? "bg-ok ring-ok/15" : "bg-bad ring-bad/15"}`}
                    style={{ width: r, height: r }}
                  />
                  <span
                    className={`bg-ink shadow-pop pointer-events-none absolute top-full z-30 mt-2 rounded-md px-2 py-1 text-[11px] whitespace-nowrap text-white transition-opacity ${
                      anchor === "left"
                        ? "left-0"
                        : anchor === "right"
                          ? "right-0 left-auto"
                          : "left-1/2 -translate-x-1/2"
                    } ${isHover ? "opacity-100" : "opacity-0"}`}
                  >
                    {t.topic.replace(/_/g, " ")}
                    <span className="tnum ml-1.5 text-white/60">
                      {Math.round(t.accuracy)}% · {t.avgTimeSec}s
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-ink-4 relative mt-1.5 h-4 text-[11px]">
            {X_TICKS.map((v) => (
              <span
                key={v}
                className="absolute -translate-x-1/2"
                style={{ left: `${x(v)}%` }}
              >
                {v}s
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
