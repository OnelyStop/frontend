"use client";

import {
  ButtonLink,
  Card,
  Empty,
  PageHeader,
  SectionTitle,
} from "@/design-system";
import { useApp } from "@/context/AppContext";
import {
  NEGATIVE_MARK,
  SECTION_FROM_DB,
  SECTION_LABEL,
} from "@/data/navigation";
import type { Progress } from "@/features/attempts/progress.server";

// The bars are the last seven days ending today, not Monday to Sunday.
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

// Labelled from the date the server bucketed by, so a bar can never sit under another day's letter.
const dayInitial = (date: string) =>
  DAY_INITIALS[new Date(`${date}T00:00:00Z`).getUTCDay()] as string;

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
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

      <div className="border-line mb-10 grid grid-cols-1 border-t border-l md:grid-cols-3">
        <Stat
          label="Accuracy"
          value={`${acc}%`}
          note={`${correct} of ${attempted} attempted`}
        />
        <Stat
          label="Marks lost to negatives"
          value={`−${lost.toFixed(2)}`}
          note={`${wrong} wrong × ${NEGATIVE_MARK}`}
        />
        <Stat
          label="Average pace"
          value={avgSec === null ? "—" : `${avgSec}s`}
          note="target is 45s a question"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <SectionTitle aside="accuracy · seconds per question">
            By section
          </SectionTitle>

          <div className="grid gap-5">
            {sections.map((r) => {
              const a = Math.round((r.correct / r.attempted) * 100);
              const fast = r.avgSec !== null && r.avgSec <= 45;
              return (
                <div key={r.section} className="grid gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[14.5px]">
                      {sectionLabel(r.section)}
                    </span>
                    <span className="flex-1" />
                    <span className="tnum text-[14.5px]">{a}%</span>
                    <span
                      className={`tnum w-10 text-right text-[13px] ${r.avgSec === null ? "text-ink-4" : fast ? "text-ok" : "text-bad"}`}
                    >
                      {r.avgSec === null ? "—" : `${r.avgSec}s`}
                    </span>
                  </div>
                  <div className="rounded-pill bg-line h-1.5 overflow-hidden">
                    <div
                      className="rounded-pill bg-ink h-full"
                      style={{ width: `${a}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="border-line text-ink-3 mt-7 border-t pt-5 text-[13px] leading-relaxed">
            A section can be accurate and still cost you the paper if it is
            slow.
          </p>
        </Card>

        <Card>
          <SectionTitle aside={`${weekTotal} questions`}>
            This week
          </SectionTitle>

          <div className="flex h-40 gap-2">
            {week.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col gap-2">
                <div className="flex flex-1 items-end">
                  <div
                    className={`w-full rounded-t-sm transition-all ${d.count ? "bg-ink" : "bg-line"}`}
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

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border-line relative border-r border-b p-7">
      <p className="text-ink-2 text-[14px]">{label}</p>
      <p className="tnum mt-3 text-[38px] leading-none tracking-[-0.03em]">
        {value}
      </p>
      <p className="text-ink-3 mt-3 text-[13px] leading-relaxed">{note}</p>
      <span
        aria-hidden
        className="bg-ink-4 absolute right-[-2.5px] bottom-[-2.5px] size-[5px] rounded-full"
      />
    </div>
  );
}
