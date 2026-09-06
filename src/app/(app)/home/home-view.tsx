"use client";

import {
  ButtonLink,
  Card,
  DarkPanel,
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

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
}

export function HomeView({ progress }: { progress: Progress }) {
  const { board, profile } = useApp();
  const { attempted, correct, wrong, avgSec, sections } = progress;

  const greeting = profile.name
    ? `Good evening, ${profile.name.split(" ")[0]}`
    : "Good evening";

  if (attempted === 0) {
    return (
      <>
        <PageHeader
          title={greeting}
          sub={`Nothing has been graded yet, so there is nothing here to read. Everything on this page comes from your own submitted attempts on ${board}.`}
        />
        <Card pad={false}>
          <Empty
            title="No attempts yet"
            sub="Sit a mock or a drill and this page fills in with your accuracy, your pace and the marks negative marking takes back."
            action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  const acc = Math.round((correct / attempted) * 100);
  const lost = wrong * NEGATIVE_MARK;
  const weakest = sections.reduce((a, b) =>
    a.correct / a.attempted <= b.correct / b.attempted ? a : b,
  );
  const weakestAcc = Math.round((weakest.correct / weakest.attempted) * 100);

  return (
    <>
      <PageHeader
        title={greeting}
        sub={`${board} · last 30 days. ${sectionLabel(weakest.section)} is your weakest section at ${weakestAcc}% — everything below is measured from attempts you have submitted.`}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <SectionTitle aside="accuracy · seconds per question">
            By section
          </SectionTitle>

          <div className="grid gap-5">
            {sections.map((r) => {
              const a = Math.round((r.correct / r.attempted) * 100);
              const fast = r.avgSec <= 45;
              return (
                <div key={r.section} className="grid gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[14.5px]">
                      {sectionLabel(r.section)}
                    </span>
                    <span className="flex-1" />
                    <span className="tnum text-[14.5px]">{a}%</span>
                    <span
                      className={`tnum w-10 text-right text-[13px] ${fast ? "text-ok" : "text-bad"}`}
                    >
                      {r.avgSec}s
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
            This is accuracy on what you attempted, not a sectional score. A
            section you barely touched will read confidently on very few
            questions.
          </p>
        </Card>

        <div className="grid content-start gap-4">
          <DarkPanel>
            <p className="text-[14px] text-white/50">{board} · last 30 days</p>
            <p className="tnum mt-4 text-[52px] leading-none tracking-[-0.04em]">
              {acc}%
            </p>
            <p className="mt-2 text-[14px] text-white/60">accuracy</p>
            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-[14px]">
              <span className="text-white/60">Questions graded</span>
              <span className="tnum">{attempted}</span>
            </div>
          </DarkPanel>

          <Card>
            <SectionTitle>Where the marks go</SectionTitle>
            <div className="grid gap-4">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2 text-[14px]">
                  Marks lost to negatives
                </span>
                <span className="tnum text-bad text-[15px]">
                  −{lost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2 text-[14px]">Wrong answers</span>
                <span className="tnum text-[15px]">{wrong}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2 text-[14px]">Average pace</span>
                <span
                  className={`tnum text-[15px] ${avgSec !== null && avgSec <= 45 ? "text-ok" : ""}`}
                >
                  {avgSec === null ? "—" : `${avgSec}s`}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
