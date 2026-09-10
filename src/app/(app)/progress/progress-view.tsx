"use client";

import {
  ButtonLink,
  Card,
  Empty,
  Figure,
  PageHeader,
  SectionTitle,
} from "@/design-system";
import { useApp } from "@/context/AppContext";
import {
  NEGATIVE_MARK,
  SECTION_FROM_DB,
  SECTION_KEY,
  SECTION_LABEL,
  SECTION_SHORT,
} from "@/data/navigation";
import type { Progress } from "@/features/attempts/progress.server";
import { ACC_LINE, PACE_TARGET } from "@/features/attempts/verdict";

// The bars are the last seven days ending today, not Monday to Sunday.
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

// Labelled from the date the server bucketed by, so a bar can never sit under another day's letter.
const dayInitial = (date: string) =>
  DAY_INITIALS[new Date(`${date}T00:00:00Z`).getUTCDay()] as string;

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
}

function sectionInk(section: string) {
  const key = SECTION_KEY[SECTION_FROM_DB[section]];
  return key ? `var(--color-${key})` : "var(--color-ink-4)";
}

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

export function ProgressView({ progress }: { progress: Progress }) {
  const { board } = useApp();
  const { attempted, correct, wrong, avgSec, sections, week } = progress;

  const sub = `${board} · last 30 days. Accuracy alone does not clear a cutoff — pace and the marks negative marking takes back decide the paper.`;

  if (attempted === 0) {
    return (
      <>
        <PageHeader title="Progress" sub={sub} />
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
  const ranked = sections
    .map((r) => ({ ...r, acc: Math.round((r.correct / r.attempted) * 100) }))
    .sort((a, b) => a.acc - b.acc);
  const worst = ranked.find((r) => r.acc < ACC_LINE) ?? null;
  // Only derivable when a pace exists; untimed answers would make this read as zero minutes.
  const atDesk = avgSec === null ? null : hoursMinutes(avgSec * attempted);
  const weekTotal = week.reduce((n, d) => n + d.count, 0);
  const weekPeak = Math.max(1, ...week.map((d) => d.count));
  const daysSat = week.filter((d) => d.count > 0).length;
  // Counted backwards from today, so a gap yesterday ends the run even if the days before it were unbroken.
  const streak = week.length - 1 - findLastGap(week);

  return (
    <>
      <PageHeader title="Progress" sub={sub} />

      {/* Bare on the stage: a figure in a tinted box is a block, and the page has one card already. */}
      <section className="mb-10">
        <SectionTitle
          aside={atDesk ? `about ${atDesk} at the desk` : undefined}
        >
          {attempted} questions over 30 days
        </SectionTitle>

        <div className="flex flex-wrap items-end gap-x-12 gap-y-7">
          <div>
            <p className="tnum text-[68px] leading-[0.85] font-bold tracking-[-0.05em]">
              {correct}
              <span className="text-ink-3 text-[30px] font-semibold">
                {" "}
                / {acc}%
              </span>
            </p>
            <p className="text-ink-2 mt-3 text-[14px]">
              right of {attempted} graded
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-5">
            <Figure tone="bad" value={`−${lost.toFixed(2)}`}>
              {wrong} wrong × {NEGATIVE_MARK} given back to negative marking
            </Figure>
            <Figure
              tone={onPace ? "ok" : "warn"}
              value={avgSec === null ? "—" : `${avgSec}s`}
            >
              a question, against a {PACE_TARGET}s budget
            </Figure>
          </div>
        </div>
      </section>

      {/* The one card on the page: the section split is what /progress is actually for, and the tint is how it says so. */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card tone="info">
          <SectionTitle
            aside={`${ACC_LINE}% line · ${PACE_TARGET}s a question`}
          >
            How far each section sits from the line
          </SectionTitle>

          {/* One shared axis, so five sections are compared against the line rather than against five separate gauges. */}
          <div className="bg-canvas rounded-ctl px-5 py-6">
            <div className="grid gap-1">
              {ranked.map((r) => {
                const over = r.acc >= ACC_LINE;
                // Floored so a section a point or two off the line still draws a bar rather than a speck.
                const width = Math.max(Math.abs(r.acc - ACC_LINE), 0.9);
                const left = over ? ACC_LINE : ACC_LINE - width;
                return (
                  <div
                    key={r.section}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className="flex w-24 shrink-0 items-center gap-2 sm:w-40">
                      <i
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: sectionInk(r.section) }}
                        aria-hidden
                      />
                      {/* The short name below sm, or the label eats the chart it is labelling. */}
                      <span className="truncate text-[13.5px] sm:hidden">
                        {SECTION_SHORT[SECTION_FROM_DB[r.section]] ?? r.section}
                      </span>
                      <span className="hidden truncate text-[13.5px] sm:inline">
                        {sectionLabel(r.section)}
                      </span>
                    </span>

                    <span className="relative h-6 min-w-0 flex-1">
                      <span
                        className="bg-ink/[0.06] absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                        aria-hidden
                      />
                      <span
                        className="bg-ink/20 absolute inset-y-0 w-px"
                        style={{ left: `${ACC_LINE}%` }}
                        aria-hidden
                      />
                      <span
                        className={`absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full ${over ? "bg-ok" : "bg-bad"}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        aria-hidden
                      />
                    </span>

                    <span
                      className={`tnum w-12 shrink-0 text-right text-[14.5px] ${over ? "text-ok" : "text-bad"}`}
                    >
                      {over ? "+" : "−"}
                      {Math.abs(r.acc - ACC_LINE)}
                    </span>
                    {/* An untimed section reports no pace; a 0 here would read as instant rather than unknown. */}
                    <span
                      className={`tnum hidden w-12 shrink-0 text-right text-[13px] sm:block ${
                        r.avgSec === null
                          ? "text-ink-4"
                          : r.avgSec <= PACE_TARGET
                            ? "text-ok"
                            : "text-bad"
                      }`}
                    >
                      {r.avgSec === null ? "—" : `${r.avgSec}s`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-ink-4 mt-2 flex items-center gap-3 text-[11.5px]">
              <span className="w-24 shrink-0 sm:w-40" />
              <span className="relative h-4 min-w-0 flex-1">
                <span
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${ACC_LINE}%` }}
                >
                  {ACC_LINE}% line
                </span>
              </span>
              <span className="w-12 shrink-0 text-right">pts</span>
              <span className="hidden w-12 shrink-0 text-right sm:block">
                pace
              </span>
            </div>
          </div>

          <p className="text-ink-2 mt-5 text-[13.5px] leading-relaxed">
            {worst
              ? `${sectionLabel(worst.section)} is the one costing you most — ${ACC_LINE - worst.acc} points under the line across ${worst.attempted} questions.`
              : `Every section is at or above the ${ACC_LINE}% line.`}{" "}
            A section can still cost you the paper if it is slow, so the pace
            beside each one is what a question actually takes you.
          </p>
        </Card>

        {/* Bare beside the card, so the page has one filled block and open space around it. */}
        <div>
          <SectionTitle
            aside={weekTotal > 0 ? `${weekTotal} questions` : undefined}
          >
            This week
          </SectionTitle>

          <p className="tnum text-[30px] leading-none tracking-[-0.03em]">
            {daysSat}
            <span className="text-ink-3 text-[17px]"> of 7 days</span>
          </p>

          {/* Volume, so the bar is ink; a day missed is a tick on the baseline, not a box waiting to be filled. */}
          <div className="mt-5 grid grid-cols-7 gap-2">
            {week.map((d) => (
              <div key={d.date} className="grid gap-2">
                <div
                  className="flex h-12 items-end"
                  title={`${d.date} · ${d.count} questions`}
                >
                  <span
                    className={`w-full rounded-full ${d.count ? "bg-ink" : "bg-line-2"}`}
                    style={{
                      height: d.count
                        ? `${Math.max(10, (d.count / weekPeak) * 100)}%`
                        : 2,
                    }}
                  />
                </div>
                <span className="text-ink-4 text-center text-[11.5px]">
                  {dayInitial(d.date)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-ink-2 mt-5 text-[13px] leading-relaxed">
            {weekTotal === 0
              ? "Nothing in the last seven days. Everything above is the 30-day window, so it will not move until you sit something."
              : streak > 0
                ? `${streak} day${streak === 1 ? "" : "s"} running. A broken streak costs more in recall than a heavy day gains.`
                : "The run is broken. A broken streak costs more in recall than a heavy day gains."}
          </p>
        </div>
      </div>
    </>
  );
}
