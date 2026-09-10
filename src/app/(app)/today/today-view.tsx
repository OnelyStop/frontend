"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Map } from "lucide-react";
import {
  ActiveCard,
  ButtonLink,
  Canvas,
  Card,
  Empty,
  Figure,
  PageHeader,
  SectionTitle,
  StatusPill,
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

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
}

function sectionInk(section: string) {
  const key = SECTION_KEY[SECTION_FROM_DB[section]];
  return key ? `var(--color-${key})` : "var(--color-ink-4)";
}

// Each section wears its own tint, the same palette the knowledge base uses, so five rows read as five subjects.
const SECTION_BAND: Record<string, string> = {
  quant: "bg-quant-soft",
  reasoning: "bg-reasoning-soft",
  english: "bg-english-soft",
  ga: "bg-ga-soft",
  computer: "bg-computer-soft",
};

function sectionBand(section: string) {
  return SECTION_BAND[SECTION_KEY[SECTION_FROM_DB[section]]] ?? "bg-panel";
}

export function TodayView({ progress }: { progress: Progress }) {
  const router = useRouter();
  const { board, profile } = useApp();
  const { attempted, correct, wrong, avgSec, sections } = progress;

  const greeting = profile.name
    ? `Good evening, ${profile.name.split(" ")[0]}`
    : "Good evening";

  if (attempted === 0) {
    return (
      <>
        <PageHeader title={greeting} />
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
  const onPace = avgSec !== null && avgSec <= PACE_TARGET;
  // Best first, so the sections needing work fall to the bottom of the list.
  const ranked = sections
    .map((r) => ({ ...r, acc: Math.round((r.correct / r.attempted) * 100) }))
    .sort((a, b) => b.acc - a.acc);
  const weakest = sections.reduce((a, b) =>
    a.correct / a.attempted <= b.correct / b.attempted ? a : b,
  );
  const weakestAcc = Math.round((weakest.correct / weakest.attempted) * 100);
  const weakestName = sectionLabel(weakest.section);

  return (
    <>
      <PageHeader
        title={greeting}
        sub={`${board} · last 30 days. ${weakestName} is your weakest section at ${weakestAcc}% — everything here is measured from attempts you have submitted.`}
      />

      <Canvas
        aside={
          <>
            <SectionTitle>What to do next</SectionTitle>

            {/* At most one in-progress card per screen, or being in progress stops meaning anything. */}
            <ActiveCard
              title={weakestName}
              resumeLabel={`Drill ${weakestName}`}
              onResume={() => router.push("/drills")}
              status={
                <StatusPill tone="live">{weakestAcc}% · your lowest</StatusPill>
              }
            >
              A drill pulls from the same bank, timed like the section.
            </ActiveCard>

            {/* Rows, not more cards: one card in progress means something, four stacked cards mean nothing. */}
            <nav className="border-line divide-line divide-y border-y">
              <NextRow
                href="/mocks"
                mark={<FileText size={17} strokeWidth={2} />}
                title="Sit a full paper"
                aside="60 min"
              >
                Real sectional timing, so pace is measured the way the hall
                measures it.
              </NextRow>
              {wrong > 0 ? (
                <NextRow
                  href="/attempt-map"
                  mark={<Map size={17} strokeWidth={2} />}
                  tone="bad"
                  title={`Review ${wrong} wrong ${wrong === 1 ? "answer" : "answers"}`}
                  aside={`−${lost.toFixed(2)}`}
                >
                  The attempt map shows which topics they came from.
                </NextRow>
              ) : null}
            </nav>
          </>
        }
      >
        <SectionTitle aside={`${attempted} graded`}>
          Where the marks go
        </SectionTitle>

        {/* One figure dominates and two support it: three equal boxes gave three unrelated numbers the same weight. */}
        <div className="flex flex-wrap items-end gap-x-12 gap-y-7">
          <div>
            <p className="tnum text-[68px] leading-[0.85] font-bold tracking-[-0.05em]">
              {acc}
              <span className="text-ink-3 text-[30px] font-semibold">%</span>
            </p>
            <p className="text-ink-2 mt-3 text-[14px]">
              accuracy — {correct} right of {attempted} graded
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

        <SectionTitle
          className="mt-12"
          aside={`${ACC_LINE}% line · ${PACE_TARGET}s a question`}
        >
          By section
        </SectionTitle>

        {/* A band per section in its own tint, with white paper for the track — five subjects, not five grey rows. */}
        <div className="grid gap-2.5">
          {ranked.map((r) => (
            <div
              key={r.section}
              className={`rounded-2xl px-4 py-3.5 ${sectionBand(r.section)}`}
            >
              <div className="flex items-baseline gap-2.5">
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                  {sectionLabel(r.section)}
                </span>
                <span className="tnum text-[17px] leading-none tracking-[-0.02em]">
                  {r.acc}%
                </span>
                {/* An untimed section reports no pace; a 0 would read as instant rather than unknown. */}
                <span
                  className={`tnum w-9 text-right text-[12.5px] ${
                    r.avgSec === null
                      ? "opacity-45"
                      : r.avgSec <= PACE_TARGET
                        ? "text-ok"
                        : "text-bad"
                  }`}
                >
                  {r.avgSec === null ? "—" : `${r.avgSec}s`}
                </span>
              </div>

              <div className="bg-canvas relative mt-2.5 h-1.5 rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.acc}%`,
                    background: sectionInk(r.section),
                  }}
                />
                <span
                  className="bg-ink/35 absolute -top-1 -bottom-1 w-px"
                  style={{ left: `${ACC_LINE}%` }}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-ink-3 mt-5 text-[13px] leading-relaxed">
          The notch is the {ACC_LINE}% line. This is accuracy on what you
          attempted, not a sectional score — a section you barely touched will
          read confidently on very few questions.
        </p>
      </Canvas>
    </>
  );
}

/** One thing to do next, on a hairline. The disc is grey unless the row costs you. */
function NextRow({
  href,
  mark,
  tone = "neutral",
  title,
  aside,
  children,
}: {
  href: string;
  mark: React.ReactNode;
  tone?: "neutral" | "bad";
  title: string;
  aside: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 py-4">
      <span
        aria-hidden
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          tone === "bad" ? "bg-bad-soft text-bad" : "bg-panel text-ink-2"
        }`}
      >
        {mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-3">
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
            {title}
          </span>
          <span className="tnum text-ink-3 shrink-0 text-[13px]">{aside}</span>
        </span>
        <span className="text-ink-3 mt-0.5 block text-[13px] leading-snug">
          {children}
        </span>
      </span>
      <ChevronRight
        size={16}
        className="text-ink-4 group-hover:text-ink shrink-0 transition-colors"
        aria-hidden
      />
    </Link>
  );
}
