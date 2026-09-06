"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  ButtonLink,
  Card,
  Empty,
  PageHeader,
  SectionTitle,
  Segmented,
} from "@/design-system";
import {
  NEGATIVE_MARK,
  SECTIONS,
  SECTION_DB,
  SECTION_FROM_DB,
  SECTION_KEY,
  SECTION_LABEL,
} from "@/data/navigation";
import type { TopicMapRow } from "@/features/attempts/progress.server";

/* The only two lines on this page. Every verdict, colour and ranking below
   comes from a topic's position against these — nothing else is asserted. */
const PACE = 45;
const ACC_LINE = 70;

const SKIP_LIST_SHOWN = 5;

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
}

function sectionDot(section: string) {
  const key = SECTION_KEY[SECTION_FROM_DB[section]];
  return key ? `var(--color-${key})` : "var(--color-ink-4)";
}

const BANK_SECTIONS: string[] = SECTIONS.map((s) => SECTION_DB[s]);

function topicId(t: TopicMapRow) {
  return `${t.section}::${t.topic}`;
}

type Zone = "first" | "iftime" | "fix" | "skip";

const ZONES: Record<
  Zone,
  {
    label: string;
    short: string;
    advice: string;
    dot: string;
    ring: string;
    text: string;
    chip: string;
  }
> = {
  first: {
    label: "Attempt first",
    short: `${PACE}s or faster, ${ACC_LINE}% or better`,
    advice:
      "Inside the pace target and above the accuracy line. These are the marks you can count on — clear them before the paper gets interesting.",
    dot: "bg-ok",
    ring: "ring-ok/20",
    text: "text-ok",
    chip: "bg-ok-soft text-ok",
  },
  iftime: {
    label: "Attempt if time",
    short: `${ACC_LINE}% or better, but slower than ${PACE}s`,
    advice:
      "You get these right, but each one costs more than the pace target allows. Come back once the fast marks are in.",
    dot: "bg-brand",
    ring: "ring-brand/20",
    text: "text-brand",
    chip: "bg-brand-soft text-brand",
  },
  fix: {
    label: "Fix the errors",
    short: `${PACE}s or faster, but under ${ACC_LINE}%`,
    advice:
      "Inside the pace target and under the accuracy line — the time is there, the accuracy is not.",
    dot: "bg-warn",
    ring: "ring-warn/20",
    text: "text-warn",
    chip: "bg-warn-soft text-warn",
  },
  skip: {
    label: "Skip in the exam",
    short: `Slower than ${PACE}s and under ${ACC_LINE}%`,
    advice: `Outside the pace target and under the accuracy line. At −${NEGATIVE_MARK} a wrong answer, these cost you the time and the marks together.`,
    dot: "bg-bad",
    ring: "ring-bad/20",
    text: "text-bad",
    chip: "bg-bad-soft text-bad",
  },
};

function zoneOf(t: TopicMapRow): Zone {
  const fast = t.avgSec <= PACE;
  const accurate = t.accuracy >= ACC_LINE;
  if (fast && accurate) return "first";
  if (!fast && accurate) return "iftime";
  if (fast && !accurate) return "fix";
  return "skip";
}

/** Marks per attempt at this accuracy, after negative marking takes its share. */
function expected(t: TopicMapRow) {
  const a = t.accuracy / 100;
  return a - (1 - a) * NEGATIVE_MARK;
}

// avgSec is 0 only when no answer in the topic carried a time, so there is no rate to give.
function rate(t: TopicMapRow) {
  return t.avgSec > 0 ? (expected(t) / t.avgSec) * 60 : 0;
}

// Plot padding, so a dot at 0 or 100 is not half outside the frame.
const PAD = 7;
const y = (accPct: number) => PAD + (accPct / 100) * (100 - PAD * 2);

const Y_TICKS = [0, 25, 50, 75, 100];
const AXIS_STEP = 30;
const AXIS_MIN = 90;

type SortKey = "rate" | "acc" | "sec" | "attempted";

export function AttemptMapView({ topics }: { topics: TopicMapRow[] }) {
  const { board } = useApp();
  const [section, setSection] = useState<string>("All");
  const [open, setOpen] = useState<TopicMapRow | null>(null);
  const [hover, setHover] = useState<TopicMapRow | null>(null);
  const [sort, setSort] = useState<SortKey>("rate");
  const [asc, setAsc] = useState(false);

  const sub = `${board} · last 30 days. Every topic placed by the accuracy you answer it with against the seconds it costs you. With −${NEGATIVE_MARK} for a wrong answer, the bottom-right corner takes marks off you.`;

  // Only sections that actually have topics, in the exam's own section order.
  const sections = useMemo(() => {
    const present = new Set(topics.map((t) => t.section));
    return [
      ...BANK_SECTIONS.filter((s) => present.has(s)),
      ...[...present].filter((s) => !BANK_SECTIONS.includes(s)).sort(),
    ];
  }, [topics]);

  const shown = useMemo(
    () => topics.filter((t) => section === "All" || t.section === section),
    [topics, section],
  );

  const counts = useMemo(() => {
    const c: Record<Zone, number> = { first: 0, iftime: 0, fix: 0, skip: 0 };
    shown.forEach((t) => (c[zoneOf(t)] += 1));
    return c;
  }, [shown]);

  const stats = useMemo(() => {
    const paces = shown.map((t) => t.avgSec).sort((a, b) => a - b);
    const attempted = shown.reduce((n, t) => n + t.attempted, 0);
    const correct = shown.reduce((n, t) => n + t.correct, 0);
    const skips = shown.filter((t) => zoneOf(t) === "skip");
    return {
      median: paces[Math.floor(paces.length / 2)] ?? 0,
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
      banked: shown.filter((t) => zoneOf(t) === "first").length,
      skip: skips.length,
      lost: shown.reduce((n, t) => n + t.marksLost, 0),
      skipLost: skips.reduce((n, t) => n + t.marksLost, 0),
      widest: Math.max(1, ...shown.map((t) => t.attempted)),
      slowest: Math.max(0, ...shown.map((t) => t.avgSec)),
    };
  }, [shown]);

  /* The x axis stretches to the slowest topic instead of clamping at a fixed
     ceiling — a clamp would stack every slow topic on the same edge pixel. */
  const axisMax = Math.max(
    AXIS_MIN,
    Math.ceil(stats.slowest / AXIS_STEP) * AXIS_STEP,
  );
  const x = (sec: number) => PAD + (sec / axisMax) * (100 - PAD * 2);
  const xTicks = Array.from(
    { length: Math.round(axisMax / AXIS_STEP) },
    (_, i) => i * AXIS_STEP,
  );
  const pacePct = (PACE / axisMax) * 100;

  const skipList = useMemo(
    () =>
      shown
        .filter((t) => zoneOf(t) === "skip")
        .sort((a, b) => rate(a) - rate(b))
        .slice(0, SKIP_LIST_SHOWN),
    [shown],
  );

  const table = useMemo(() => {
    const get = (t: TopicMapRow) =>
      sort === "rate"
        ? rate(t)
        : sort === "acc"
          ? t.accuracy
          : sort === "sec"
            ? t.avgSec
            : t.attempted;
    return [...shown].sort((a, b) => (asc ? get(a) - get(b) : get(b) - get(a)));
  }, [shown, sort, asc]);

  const focus = hover ?? open;

  const toggleSort = (k: SortKey) => {
    if (k === sort) setAsc((v) => !v);
    else {
      setSort(k);
      setAsc(false);
    }
  };

  if (topics.length === 0) {
    return (
      <>
        <PageHeader title="Attempt map" sub={sub} />
        <Card pad={false}>
          <Empty
            title="Nothing on the map yet"
            sub="This page reads the last 30 days of submitted attempts and places a topic once you have answered a few questions in it. Sit a mock or a drill and your topics appear here."
            action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  return (
    <div data-companion>
      <PageHeader
        title="Attempt map"
        sub={sub}
        actions={
          sections.length > 1 ? (
            <Segmented
              value={section}
              options={["All", ...sections]}
              onChange={(v) => {
                setSection(v);
                setOpen(null);
              }}
              labels={Object.fromEntries(
                sections.map((s) => [s, sectionLabel(s)]),
              )}
            />
          ) : null
        }
      />

      <div className="border-line mb-10 grid grid-cols-1 border-t border-l sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Accuracy"
          value={`${stats.accuracy}%`}
          note={`${stats.correct} of ${stats.attempted} attempted`}
        />
        <Stat
          label="Median pace"
          value={`${stats.median}s`}
          note={`target is ${PACE}s a question`}
        />
        <Stat
          label="Bankable topics"
          value={String(stats.banked)}
          note={`${PACE}s or faster and ${ACC_LINE}% or better`}
        />
        <Stat
          label="On your skip list"
          value={String(stats.skip)}
          note={`slower than ${PACE}s and under ${ACC_LINE}%`}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionTitle
            aside={
              <span className="text-ink-3 text-[12px]">
                {shown.length} {shown.length === 1 ? "topic" : "topics"} ·
                bubble size is questions attempted
              </span>
            }
          >
            Accuracy against pace
          </SectionTitle>

          <div className="flex gap-3">
            <div className="relative w-9 shrink-0">
              {Y_TICKS.map((v) => (
                <span
                  key={v}
                  className="tnum text-ink-4 absolute right-0 -translate-y-1/2 text-[11px]"
                  style={{ bottom: `${y(v)}%` }}
                >
                  {v}%
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="inset-panel relative h-[440px] overflow-hidden"
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
                {xTicks.map((v) => (
                  <span
                    key={`gx${v}`}
                    className="bg-line absolute inset-y-0 w-px"
                    style={{ left: `${x(v)}%` }}
                    aria-hidden
                  />
                ))}

                {/* The two corners that carry an instruction get a wash; the
                    other two are neutral so the eye goes to these first. */}
                <span
                  className="bg-ok/[0.06] absolute top-0 left-0"
                  style={{ width: `${pacePct}%`, height: `${100 - ACC_LINE}%` }}
                  aria-hidden
                />
                <span
                  className="bg-bad/[0.045] absolute right-0 bottom-0"
                  style={{
                    width: `${100 - pacePct}%`,
                    height: `${ACC_LINE}%`,
                  }}
                  aria-hidden
                />

                <span
                  className="border-line-2 absolute inset-y-0 border-l border-dashed"
                  style={{ left: `${x(PACE)}%` }}
                  aria-hidden
                />
                <span
                  className="border-line-2 absolute inset-x-0 border-t border-dashed"
                  style={{ bottom: `${y(ACC_LINE)}%` }}
                  aria-hidden
                />
                <span
                  className="tnum rounded-pill bg-panel text-ink-2 absolute z-10 -translate-x-1/2 px-2.5 py-1 text-[11px]"
                  style={{ left: `${x(PACE)}%`, bottom: 8 }}
                >
                  {PACE}s target
                </span>
                <span
                  className="tnum rounded-pill bg-panel text-ink-2 absolute z-10 translate-y-1/2 px-2.5 py-1 text-[11px]"
                  style={{ bottom: `${y(ACC_LINE)}%`, right: 8 }}
                >
                  {ACC_LINE}% accuracy
                </span>

                {(
                  [
                    ["first", "left-3 top-3"],
                    ["iftime", "right-3 top-3"],
                    ["fix", "bottom-3 left-3"],
                    ["skip", "bottom-14 right-3"],
                  ] as const
                ).map(([z, pos]) => (
                  <span
                    key={z}
                    className={`pointer-events-none absolute ${pos} text-[12.5px] ${ZONES[z].text} opacity-80`}
                  >
                    {ZONES[z].label}
                  </span>
                ))}

                {focus ? (
                  <>
                    <span
                      className="bg-ink/20 pointer-events-none absolute inset-y-0 w-px"
                      style={{ left: `${x(focus.avgSec)}%` }}
                      aria-hidden
                    />
                    <span
                      className="bg-ink/20 pointer-events-none absolute inset-x-0 h-px"
                      style={{ bottom: `${y(focus.accuracy)}%` }}
                      aria-hidden
                    />
                  </>
                ) : null}

                {shown.map((t, i) => {
                  const z = zoneOf(t);
                  const id = topicId(t);
                  const isOpen = open ? topicId(open) === id : false;
                  const isFocus = focus ? topicId(focus) === id : false;
                  // Bubble size is volume: a big slow bubble is a bigger problem.
                  const r = Math.round(14 + (t.attempted / stats.widest) * 16);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOpen(isOpen ? null : t)}
                      onMouseEnter={() => setHover(t)}
                      aria-label={`${t.topic}: ${Math.round(t.accuracy)} percent at ${t.avgSec} seconds`}
                      className="group absolute z-20 -translate-x-1/2 translate-y-1/2"
                      style={{
                        left: `${x(t.avgSec)}%`,
                        bottom: `${y(t.accuracy)}%`,
                      }}
                    >
                      <span
                        className={`plot-in block rounded-full ring-4 transition-[transform,box-shadow] duration-200 ${ZONES[z].dot} ${ZONES[z].ring} ${
                          isFocus ? "scale-125 ring-8" : ""
                        }`}
                        style={{
                          width: r,
                          height: r,
                          animationDelay: `${i * 28}ms`,
                        }}
                      />
                      <span
                        className={`bg-ink shadow-pop pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-md px-2 py-1 text-[11px] leading-none font-medium whitespace-nowrap text-white transition-opacity ${
                          isFocus ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {t.topic}
                        <span className="tnum ml-1.5 text-white/60">
                          {Math.round(t.accuracy)}% · {t.avgSec}s
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-1.5 h-4">
                {xTicks.map((v) => (
                  <span
                    key={v}
                    className="tnum text-ink-4 absolute -translate-x-1/2 text-[11px]"
                    style={{ left: `${x(v)}%` }}
                  >
                    {v}s
                  </span>
                ))}
                <span className="tnum text-ink-4 absolute right-0 text-[11px]">
                  slower →
                </span>
              </div>
            </div>
          </div>

          <div className="border-line mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(ZONES) as Zone[]).map((z) => (
              <div key={z}>
                <div className="flex items-baseline gap-2">
                  <i
                    className={`size-2.5 shrink-0 translate-y-px rounded-full ${ZONES[z].dot}`}
                    aria-hidden
                  />
                  <span className="text-[14px]">{ZONES[z].label}</span>
                  <span className="flex-1" />
                  <span className="tnum text-[17px]">{counts[z]}</span>
                </div>
                <p className="text-ink-3 mt-1.5 pl-[18px] text-[13px] leading-relaxed">
                  {ZONES[z].short}
                </p>
              </div>
            ))}
          </div>

          <p className="text-ink-3 mt-5 text-[13px] leading-relaxed">
            A verdict is the two lines and nothing else: {PACE} seconds a
            question, and {ACC_LINE}% accuracy on what you attempt.
          </p>
        </Card>

        <div className="grid content-start gap-5">
          {open ? (
            <Card>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] leading-snug tracking-[-0.02em]">
                    {open.topic}
                  </p>
                  <p className="text-ink-3 mt-1.5 flex items-center gap-1.5 text-[13px]">
                    <i
                      className="size-2 rounded-full"
                      style={{ background: sectionDot(open.section) }}
                      aria-hidden
                    />
                    {sectionLabel(open.section)} · {open.correct} of{" "}
                    {open.attempted} correct
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="text-ink-4 hover:text-ink text-[13px]"
                >
                  Close
                </button>
              </div>

              <p
                className={`rounded-pill mt-5 inline-flex px-3 py-1 text-[13px] ${ZONES[zoneOf(open)].chip}`}
              >
                {ZONES[zoneOf(open)].label}
              </p>
              <p className="text-ink-2 mt-4 text-[14px] leading-relaxed">
                {ZONES[zoneOf(open)].advice}
              </p>

              <dl className="border-line mt-5 grid gap-3 border-t pt-4">
                {(
                  [
                    [
                      "Accuracy",
                      `${Math.round(open.accuracy)}%`,
                      open.accuracy < ACC_LINE,
                    ],
                    ["Your pace", `${open.avgSec}s`, open.avgSec > PACE],
                    [
                      "Marks lost to negatives",
                      `−${open.marksLost.toFixed(2)}`,
                      false,
                    ],
                    [
                      "Marks per attempt",
                      `${expected(open) >= 0 ? "+" : ""}${expected(open).toFixed(2)}`,
                      expected(open) < 0,
                    ],
                    [
                      "Marks per minute",
                      open.avgSec > 0 ? rate(open).toFixed(2) : "—",
                      false,
                    ],
                  ] as const
                ).map(([label, value, bad]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between"
                  >
                    <dt className="text-ink-2 text-[14px]">{label}</dt>
                    <dd className={`tnum text-[15px] ${bad ? "text-bad" : ""}`}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                href="/drills"
                className="rounded-pill bg-ink hover:bg-ink/85 mt-6 flex h-10 items-center justify-center text-[14px] text-white transition-colors"
              >
                Practise in drills
              </Link>
            </Card>
          ) : (
            <Card>
              <SectionTitle
                aside={
                  <span className="text-ink-3 text-[12px]">
                    worst rate first
                  </span>
                }
              >
                Leave these in the hall
              </SectionTitle>
              {skipList.length === 0 ? (
                <p className="text-ink-3 text-[13px] leading-relaxed">
                  No topic here is both slower than {PACE}s and under {ACC_LINE}
                  % accurate, so nothing lands in the skip corner.
                </p>
              ) : (
                <ol className="grid gap-3">
                  {skipList.map((t, i) => (
                    <li key={topicId(t)}>
                      <button
                        type="button"
                        onClick={() => setOpen(t)}
                        onMouseEnter={() => setHover(t)}
                        onMouseLeave={() => setHover(null)}
                        className="rounded-ctl hover:bg-brand-soft/50 flex w-full items-center gap-3 px-2 py-1.5 text-left transition-colors"
                      >
                        <span className="tnum text-ink-4 w-4 shrink-0 text-[13px]">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px]">
                            {t.topic}
                          </span>
                          <span className="tnum text-ink-3 block text-[13px]">
                            {Math.round(t.accuracy)}% at {t.avgSec}s
                          </span>
                        </span>
                        <span className="tnum text-bad shrink-0 text-[14px]">
                          {rate(t).toFixed(2)}
                          <span className="text-ink-4 text-[12px]">/min</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <p className="border-line text-ink-3 mt-4 border-t pt-4 text-[12.5px] leading-relaxed">
                Ranked by marks a minute — what a topic returns after negative
                marking, over the time it takes you.
              </p>
            </Card>
          )}

          <Card className="bg-ink text-white">
            <p className="text-[14px] text-white/50">
              What negative marking took back
            </p>
            <p className="mt-4 text-[15px] leading-[1.55] text-white/85">
              <span className="tnum text-white">
                −{stats.lost.toFixed(2)} marks
              </span>{" "}
              over{" "}
              <span className="tnum text-white">
                {stats.attempted - stats.correct} wrong answers
              </span>{" "}
              in the last 30 days, at −{NEGATIVE_MARK} each.{" "}
              {stats.skip > 0
                ? `The skip corner accounts for −${stats.skipLost.toFixed(2)} of it, across ${stats.skip} ${stats.skip === 1 ? "topic" : "topics"}.`
                : "None of it came from the skip corner."}
            </p>
            <Link
              href="/mocks"
              className="rounded-pill text-ink mt-7 flex h-10 items-center justify-center bg-white text-[14px] transition-opacity hover:opacity-90"
            >
              Sit a mock
            </Link>
          </Card>
        </div>
      </div>

      {/* Every topic as a table, because the plot answers "where" and the table
          answers "in what order". */}
      <Card className="mt-4" pad={false}>
        <div className="px-8 pt-8 pb-2">
          <SectionTitle aside={`sorted by ${SORT_LABEL[sort].toLowerCase()}`}>
            Every topic in attempt order
          </SectionTitle>
        </div>

        <div className="overflow-x-auto px-3 pb-3">
          <table className="inset-panel w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-line text-ink-3 border-b text-[13px]">
                <th className="py-3.5 pr-3 pl-6 font-normal">Topic</th>
                <th className="px-3 py-3.5 font-normal">Verdict</th>
                <SortHead
                  k="attempted"
                  sort={sort}
                  asc={asc}
                  onClick={toggleSort}
                />
                <SortHead k="acc" sort={sort} asc={asc} onClick={toggleSort} />
                <SortHead k="sec" sort={sort} asc={asc} onClick={toggleSort} />
                <SortHead k="rate" sort={sort} asc={asc} onClick={toggleSort} />
                <th className="py-3.5 pr-6 pl-3" />
              </tr>
            </thead>
            <tbody>
              {table.map((t) => {
                const z = zoneOf(t);
                const id = topicId(t);
                return (
                  <tr
                    key={id}
                    onMouseEnter={() => setHover(t)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setOpen(t)}
                    className={`border-line cursor-pointer border-b transition-colors last:border-0 ${
                      open && topicId(open) === id
                        ? "bg-brand-soft/60"
                        : "hover:bg-brand-soft/40"
                    }`}
                  >
                    <td className="py-4 pr-3 pl-6">
                      <span className="flex items-center gap-2.5">
                        <i
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: sectionDot(t.section) }}
                          aria-hidden
                        />
                        <span className="text-[14.5px]">{t.topic}</span>
                        <span className="text-ink-4 text-[13px]">
                          {sectionLabel(t.section)}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-pill inline-flex px-2.5 py-1 text-[12.5px] ${ZONES[z].chip}`}
                      >
                        {ZONES[z].label}
                      </span>
                    </td>
                    <td className="tnum text-ink-2 px-3 py-4 text-right text-[14px]">
                      {t.attempted}
                    </td>
                    <td className="tnum px-3 py-4 text-right text-[14px]">
                      {Math.round(t.accuracy)}%
                    </td>
                    <td
                      className={`tnum px-3 py-4 text-right text-[14px] ${t.avgSec > PACE ? "text-bad" : "text-ok"}`}
                    >
                      {t.avgSec}s
                    </td>
                    <td className="tnum px-3 py-4 text-right text-[14px]">
                      {t.avgSec > 0 ? rate(t).toFixed(2) : "—"}
                    </td>
                    <td className="py-4 pr-6 pl-3 text-right">
                      <Link
                        href="/drills"
                        onClick={(e) => e.stopPropagation()}
                        className="text-ink-3 decoration-line-2 hover:text-ink text-[13.5px] underline underline-offset-4 transition-colors"
                      >
                        Drill
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const SORT_LABEL: Record<SortKey, string> = {
  attempted: "Attempted",
  acc: "Accuracy",
  sec: "Pace",
  rate: "Marks / min",
};

function SortHead({
  k,
  sort,
  asc,
  onClick,
}: {
  k: SortKey;
  sort: SortKey;
  asc: boolean;
  onClick: (k: SortKey) => void;
}) {
  const on = sort === k;
  return (
    <th className="px-3 py-3.5 text-right font-normal">
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 transition-colors ${
          on ? "text-ink" : "hover:text-ink-2"
        }`}
      >
        {SORT_LABEL[k]}
        {on ? (
          asc ? (
            <ArrowUp size={11} strokeWidth={2.5} />
          ) : (
            <ArrowDown size={11} strokeWidth={2.5} />
          )
        ) : null}
      </button>
    </th>
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
