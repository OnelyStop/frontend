"use client";

import {
  ButtonLink,
  Card,
  Empty,
  EventCard,
  EventMark,
  type EventTone,
  PageHeader,
  SectionTitle,
  StatusPill,
  TargetBar,
  Tile,
} from "@/design-system";
import { useApp } from "@/context/AppContext";
import {
  NEGATIVE_MARK,
  SECTION_FROM_DB,
  SECTION_KEY,
  SECTION_LABEL,
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

// A section's own colour, so five cards in a row are five sections rather than one blue wall.
const SECTION_EVENT_TONE: Record<string, EventTone> = {
  quant: "quant",
  reasoning: "reasoning",
  english: "english",
  ga: "ga",
  computer: "computer",
};

function sectionTone(section: string): EventTone {
  return SECTION_EVENT_TONE[SECTION_KEY[SECTION_FROM_DB[section]]] ?? "info";
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
  const weekTotal = week.reduce((n, d) => n + d.count, 0);
  const weekPeak = Math.max(1, ...week.map((d) => d.count));

  return (
    <>
      <PageHeader title="Progress" sub={sub} />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Tile
          value={`${acc}%`}
          label={`Accuracy · ${correct} of ${attempted}`}
          tone="info"
        />
        <Tile
          value={`−${lost.toFixed(2)}`}
          label={`Marks lost · ${wrong} wrong × ${NEGATIVE_MARK}`}
          tone="bad"
        />
        <Tile
          value={avgSec === null ? "—" : `${avgSec}s`}
          label="Average pace · target 45s"
          tone={avgSec !== null && avgSec <= 45 ? "ok" : "neutral"}
        />
      </div>

      <SectionTitle aside={`accuracy against the ${ACC_LINE}% line`}>
        By section
      </SectionTitle>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((r) => {
          const a = Math.round((r.correct / r.attempted) * 100);
          // Untimed answers report no pace at all; a zero here would read as instant rather than unknown.
          const fast = r.avgSec !== null && r.avgSec <= PACE_TARGET;
          return (
            <EventCard
              key={r.section}
              kind={sectionLabel(r.section)}
              when={r.avgSec === null ? "no pace yet" : `${r.avgSec}s`}
              tone={sectionTone(r.section)}
              mark={
                <EventMark disc>
                  <i
                    className="size-2.5 rounded-full"
                    style={{
                      background: `var(--color-${SECTION_KEY[SECTION_FROM_DB[r.section]] ?? "ink-4"})`,
                    }}
                  />
                </EventMark>
              }
              footer={
                <StatusPill
                  tone="live"
                  className={
                    r.avgSec === null
                      ? "text-ink-2"
                      : fast
                        ? "text-ok"
                        : "text-bad"
                  }
                >
                  {r.avgSec === null
                    ? "Accuracy only"
                    : fast
                      ? `Inside the ${PACE_TARGET}s budget`
                      : `${r.avgSec - PACE_TARGET}s over budget`}
                </StatusPill>
              }
            >
              <span className="tnum text-ink block text-[26px] leading-none tracking-[-0.03em]">
                {a}%
              </span>
              <span className="text-ink-2 mt-1.5 block text-[13px]">
                {r.correct} of {r.attempted} correct
              </span>
              <TargetBar
                value={a}
                target={ACC_LINE}
                max={100}
                className="mt-4"
              />
            </EventCard>
          );
        })}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card tone="info">
          <SectionTitle>What the pace costs</SectionTitle>
          <p className="text-ink-2 text-[14px] leading-relaxed">
            A section can be accurate and still cost you the paper if it is
            slow. The notch on each bar is the {ACC_LINE}% line; the number
            beside the section name is what a question actually takes you
            against a {PACE_TARGET}s budget.
          </p>
        </Card>

        <Card tone="brand">
          <SectionTitle aside={`${weekTotal} questions`}>
            This week
          </SectionTitle>

          <div className="flex h-40 gap-2">
            {week.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col gap-2">
                <div className="flex flex-1 items-end">
                  {/* A day you sat and a day you skipped are different facts; one black fill said neither. */}
                  <div
                    className={`w-full rounded-t-sm transition-all ${d.count ? "bg-brand" : "bg-ink/10"}`}
                    style={{
                      height: `${Math.max(3, (d.count / weekPeak) * 100)}%`,
                    }}
                    title={`${d.date} · ${d.count} questions`}
                  />
                </div>
                <span className="text-ink-4 text-center text-[12px]">
                  {dayInitial(d.date)}
                </span>
              </div>
            ))}
          </div>

          <p className="border-line text-ink-3 mt-6 border-t pt-5 text-[13px] leading-relaxed">
            A broken streak costs more in recall than a heavy day gains.
          </p>
        </Card>
      </div>
    </>
  );
}
