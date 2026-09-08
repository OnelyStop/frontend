"use client";

import {
  ButtonLink,
  Canvas,
  CanvasTitle,
  Card,
  Empty,
  EventCard,
  SectionTitle,
  Tile,
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
        <CanvasTitle>{greeting}</CanvasTitle>
        <Card pad={false}>
          <Empty
            title="No attempts yet"
            sub={`Sit a mock or a drill and this page fills in with your accuracy, your pace and the marks negative marking takes back on ${board}.`}
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
  const weakestName = sectionLabel(weakest.section);

  return (
    <>
      <CanvasTitle
        note={`${board} · last 30 days. ${weakestName} is your weakest section at ${weakestAcc}% — everything here is measured from attempts you have submitted.`}
      >
        {greeting}
      </CanvasTitle>

      <Canvas
        mid={
          <>
            <div className="mb-8 grid grid-cols-3 gap-4">
              <Tile value={`${acc}%`} label="Accuracy" tone="info" />
              <Tile
                value={`−${lost.toFixed(2)}`}
                label="Marks lost"
                tone="bad"
              />
              <Tile
                value={avgSec === null ? "—" : `${avgSec}s`}
                label="Average pace"
                outline
              />
            </div>

            <Card>
              <SectionTitle aside={`${attempted} graded`}>
                Where the marks go
              </SectionTitle>
              <Row label="Wrong answers" value={String(wrong)} />
              <Row
                label="Marks lost to negatives"
                value={`−${lost.toFixed(2)}`}
                tone="bad"
              />
              <Row
                label="Average pace"
                value={avgSec === null ? "—" : `${avgSec}s`}
                tone={avgSec !== null && avgSec <= 45 ? "ok" : undefined}
              />
            </Card>
          </>
        }
        aside={
          <>
            <h2 className="mb-6 text-[24px] font-bold tracking-[-0.03em]">
              What to do next
            </h2>

            <EventCard kind="Drill" when="now" tone="brand">
              {weakestName} is at {weakestAcc}%, your lowest. A drill pulls from
              the same bank, timed like the section it came from.
              <div className="mt-4">
                <ButtonLink href="/drills" size="sm">
                  Drill {weakestName}
                </ButtonLink>
              </div>
            </EventCard>

            <EventCard kind="Mock" when={board} tone="info">
              A full paper under real sectional timing, so pace is measured the
              way the hall measures it.
              <div className="mt-4">
                <ButtonLink href="/mocks" size="sm" variant="secondary">
                  Sit a mock
                </ButtonLink>
              </div>
            </EventCard>

            {wrong > 0 ? (
              <EventCard kind="Review" when={`−${lost.toFixed(2)}`} tone="warn">
                {wrong} wrong {wrong === 1 ? "answer has" : "answers have"} cost
                you {lost.toFixed(2)} marks. The attempt map shows which topics
                they came from.
                <div className="mt-4">
                  <ButtonLink href="/attempt-map" size="sm" variant="secondary">
                    Open attempt map
                  </ButtonLink>
                </div>
              </EventCard>
            ) : null}
          </>
        }
      >
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

                  <div className="rounded-pill bg-track h-2 overflow-hidden">
                    <div
                      className="rounded-pill bg-ok h-full"
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
      </Canvas>
    </>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "bad";
}) {
  return (
    <div className="border-line flex items-baseline justify-between border-b py-3 last:border-b-0">
      <span className="text-ink-2 text-[14px]">{label}</span>
      <span
        className={`tnum text-[15px] font-semibold ${tone === "bad" ? "text-bad" : tone === "ok" ? "text-ok" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
