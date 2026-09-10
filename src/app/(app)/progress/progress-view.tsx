"use client";

import Link from "next/link";
import { Map } from "lucide-react";
import {
  ButtonLink,
  Canvas,
  Card,
  Empty,
  EventCard,
  EventMark,
  EventTime,
  PageHeader,
  SectionTitle,
  Spine,
  SpineItem,
  Tile,
} from "@/design-system";
import { useApp } from "@/context/AppContext";
import { NEGATIVE_MARK } from "@/data/navigation";
import {
  SectionBands,
  rankSections,
  sectionLabel,
} from "@/features/attempts/components/SectionBands";
import { SittingCard } from "@/features/attempts/components/SittingCard";
import type {
  Progress,
  RecentAttempt,
} from "@/features/attempts/progress.server";
import { ACC_LINE, PACE_TARGET } from "@/features/attempts/verdict";

// The cells are the last seven days ending today, not Monday to Sunday.
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

// Labelled from the date the server bucketed by, so a cell can never sit under another day's letter.
const dayInitial = (date: string) =>
  DAY_INITIALS[new Date(`${date}T00:00:00Z`).getUTCDay()] as string;

/** Index of the most recent empty day, or -1 when every day in the window was sat. */
function findLastGap(week: readonly { count: number }[]): number {
  for (let i = week.length - 1; i >= 0; i--) {
    if (week[i]!.count === 0) return i;
  }
  return -1;
}

function hoursMinutes(totalSec: number): string {
  const m = Math.round(totalSec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function ProgressView({
  progress,
  recent,
}: {
  progress: Progress;
  recent: RecentAttempt[];
}) {
  const { board } = useApp();
  const { attempted, correct, wrong, avgSec, sections, week } = progress;

  if (attempted === 0) {
    return (
      <>
        <PageHeader
          title="Progress"
          sub={`${board} · last 30 days. Accuracy alone does not clear a cutoff — pace and the marks negative marking takes back decide the paper.`}
        />
        <Card pad={false}>
          <Empty
            title="No sittings yet"
            sub="This page reads the last 30 days of submitted attempts. Sit a mock or a drill and your accuracy, pace and section split appear here."
            action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  const lost = wrong * NEGATIVE_MARK;
  const acc = Math.round((correct / attempted) * 100);
  const onPace = avgSec !== null && avgSec <= PACE_TARGET;
  // Worst first: the section costing the most marks is what the page is for.
  const ranked = rankSections(sections, "worst");
  const worst = ranked.find((r) => r.acc < ACC_LINE) ?? null;
  // Only derivable when a pace exists; untimed answers would make this read as zero minutes.
  const atDesk = avgSec === null ? null : hoursMinutes(avgSec * attempted);
  const weekPeak = Math.max(1, ...week.map((d) => d.count));
  const daysSat = week.filter((d) => d.count > 0).length;
  // Counted backwards from today, so a gap yesterday ends the run even if the days before it were unbroken.
  const streak = week.length - 1 - findLastGap(week);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-[29px] leading-[1.14] font-bold tracking-[-0.03em]">
          Progress
        </h1>
        <span className="text-ink-3 text-[13px]">{board} · last 30 days</span>
      </div>

      <Canvas
        mid={
          <>
            <div className="grid grid-cols-2 gap-2.5 xl:mt-11.5">
              <Tile
                value={`−${lost.toFixed(2)}`}
                label={`${wrong} wrong × ${NEGATIVE_MARK} given back`}
                tone="bad"
              />
              <Tile
                value={avgSec === null ? "—" : `${avgSec}s`}
                label={`a question · ${PACE_TARGET}s budget`}
                tone={onPace ? "ok" : "neutral"}
                outline={!onPace}
              />
            </div>

            <Card className="mt-5">
              <SectionTitle aside={`${daysSat} of 7 days sat`}>
                This week
              </SectionTitle>

              {/* A rhythm, not a magnitude: a day sat is a filled disc, a day missed is a hollow one you can count. */}
              <div className="grid grid-cols-7 gap-1.5">
                {week.map((d, i) => {
                  const today = i === week.length - 1;
                  return (
                    <div
                      key={d.date}
                      className="grid justify-items-center gap-1.5"
                      title={`${d.date} · ${d.count} questions`}
                    >
                      <span className="text-ink-3 text-[11.5px]">
                        {dayInitial(d.date)}
                      </span>
                      <span
                        className={`tnum grid size-10 place-items-center rounded-full text-[13px] font-semibold ${
                          d.count
                            ? "bg-frame text-white"
                            : today
                              ? "bg-canvas ring-frame ring-2 ring-inset"
                              : "bg-canvas text-ink-4"
                        }`}
                        style={
                          d.count
                            ? { opacity: 0.6 + 0.4 * (d.count / weekPeak) }
                            : undefined
                        }
                      >
                        {Number(d.date.slice(8))}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-ink-2 mt-4 text-[13px] leading-relaxed">
                {daysSat === 0
                  ? "Nothing in the last seven days. Everything else here is the 30-day window, so it will not move until you sit something."
                  : streak > 0
                    ? `${streak} day${streak === 1 ? "" : "s"} running. A broken streak costs more in recall than a heavy day gains.`
                    : "The run is broken. A broken streak costs more in recall than a heavy day gains."}
              </p>
            </Card>

            <Link href="/attempt-map" className="mt-5 block">
              <EventCard
                kind="Attempt map"
                when="by topic"
                tone="ga"
                mark={
                  <EventMark disc>
                    <Map strokeWidth={2} />
                  </EventMark>
                }
                footer={<EventTime>Open the map</EventTime>}
              >
                Which topics to bank, which to try if there is time, and which
                to skip in the hall.
                {worst
                  ? ` ${sectionLabel(worst.section)} is your biggest leak.`
                  : ""}
              </EventCard>
            </Link>
          </>
        }
        aside={
          <>
            <SectionTitle aside={`${recent.length} in 30 days`}>
              Sittings
            </SectionTitle>
            {recent.length ? (
              <Spine>
                {recent.map((s) => (
                  <SpineItem key={s.id}>
                    <SittingCard sitting={s} />
                  </SpineItem>
                ))}
              </Spine>
            ) : (
              <p className="text-ink-3 text-[13px]">
                Nothing submitted in the last 30 days.
              </p>
            )}
          </>
        }
      >
        {/* The one tinted card on the page: the figure the whole month rolls up to. */}
        <Card tone="info" className="p-6 sm:p-7">
          <p className="text-[12.5px] font-semibold text-black/50">
            Accuracy · {attempted} questions over 30 days
          </p>
          <div className="mt-2 flex items-end gap-5">
            <p className="tnum text-info text-[64px] leading-[0.9] font-bold tracking-[-0.05em]">
              {acc}
              <span className="text-[28px] font-semibold opacity-55">%</span>
            </p>
            <span className="flex-1" />
            {/* Volume, not accuracy: one bar a day, so a week of silence reads as a row of ticks. */}
            <div
              className="flex h-14 items-end gap-1.5"
              aria-label="Questions a day, last seven days"
            >
              {week.map((d, i) => (
                <span
                  key={d.date}
                  title={`${d.date} · ${d.count}`}
                  className={`w-2.5 rounded-t ${i === week.length - 1 ? "bg-ink" : "bg-info"}`}
                  style={{
                    height: d.count
                      ? `${Math.max(12, (d.count / weekPeak) * 100)}%`
                      : 2,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-3 text-[13.5px] text-black/60">
            <span>
              {correct} right · {wrong} wrong
              {atDesk ? ` · ${atDesk} at the desk` : ""}
            </span>
            <span className="text-[12px] whitespace-nowrap text-black/50">
              by day
            </span>
          </div>
        </Card>

        <SectionTitle
          className="mt-8 mb-4"
          aside={`${ACC_LINE}% line · ${PACE_TARGET}s a question`}
        >
          By section
        </SectionTitle>

        <SectionBands sections={ranked} attempted />

        <p className="text-ink-2 mt-4 text-[13px] leading-relaxed">
          {worst
            ? `${sectionLabel(worst.section)} is the one costing you most — ${ACC_LINE - worst.acc} points under the line across ${worst.attempted} questions.`
            : `Every section is at or above the ${ACC_LINE}% line.`}{" "}
          A section can still cost you the paper if it is slow, so the pace
          beside each one is what a question actually takes you.
        </p>
      </Canvas>
    </>
  );
}
