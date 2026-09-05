"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, PageHeader, SectionTitle, Segmented } from "@/design-system";
import {
  NEGATIVE_MARK,
  SECTIONS,
  SECTION_KEY,
  SECTION_LABEL,
  type Subject,
} from "@/data/navigation";

/* The attempt map.
   Negative marking makes "what do I skip" the real skill in a banking exam, and
   nothing on the market answers it. Every topic is plotted by accuracy against
   speed, and the quadrant it lands in IS the advice.

   The number underneath the whole screen is marks per minute: expected marks
   after negative marking, divided by the time the topic costs. A 95-second
   puzzle at 66% earns less per minute than a 22-second simplification at 92%,
   and that — not accuracy alone — is the order you should attempt a paper in. */

type Topic = {
  id: string;
  name: string;
  section: Subject;
  qs: number;
  acc: number; // 0..1 correct when attempted
  sec: number; // average seconds per question
};

// Prelims pace is ~45s a question. Slower than this and a topic costs more
// than it returns, however accurate you are.
const PACE = 45;
const ACC_LINE = 0.7;
const MAX_SEC = 110;

const TOPICS: Topic[] = [
  {
    id: "t1",
    name: "Simplification",
    section: "Quantitative Aptitude",
    qs: 240,
    acc: 0.92,
    sec: 22,
  },
  {
    id: "t2",
    name: "Number Series",
    section: "Quantitative Aptitude",
    qs: 180,
    acc: 0.78,
    sec: 38,
  },
  {
    id: "t3",
    name: "Data Interpretation",
    section: "Quantitative Aptitude",
    qs: 320,
    acc: 0.61,
    sec: 72,
  },
  {
    id: "t4",
    name: "Quadratic Equations",
    section: "Quantitative Aptitude",
    qs: 140,
    acc: 0.84,
    sec: 31,
  },
  {
    id: "t5",
    name: "Time & Work",
    section: "Quantitative Aptitude",
    qs: 160,
    acc: 0.48,
    sec: 68,
  },
  {
    id: "t6",
    name: "Probability",
    section: "Quantitative Aptitude",
    qs: 90,
    acc: 0.35,
    sec: 84,
  },
  {
    id: "t7",
    name: "Puzzles & Seating",
    section: "Reasoning Ability",
    qs: 280,
    acc: 0.66,
    sec: 95,
  },
  {
    id: "t8",
    name: "Syllogism",
    section: "Reasoning Ability",
    qs: 150,
    acc: 0.88,
    sec: 27,
  },
  {
    id: "t9",
    name: "Inequality",
    section: "Reasoning Ability",
    qs: 120,
    acc: 0.91,
    sec: 19,
  },
  {
    id: "t10",
    name: "Blood Relations",
    section: "Reasoning Ability",
    qs: 100,
    acc: 0.74,
    sec: 41,
  },
  {
    id: "t11",
    name: "Input–Output",
    section: "Reasoning Ability",
    qs: 80,
    acc: 0.42,
    sec: 88,
  },
  {
    id: "t12",
    name: "Reading Comprehension",
    section: "English Language",
    qs: 260,
    acc: 0.69,
    sec: 58,
  },
  {
    id: "t13",
    name: "Error Spotting",
    section: "English Language",
    qs: 140,
    acc: 0.81,
    sec: 26,
  },
  {
    id: "t14",
    name: "Cloze Test",
    section: "English Language",
    qs: 120,
    acc: 0.55,
    sec: 49,
  },
  {
    id: "t15",
    name: "Para Jumbles",
    section: "English Language",
    qs: 90,
    acc: 0.44,
    sec: 62,
  },
  {
    id: "t16",
    name: "Banking Awareness",
    section: "General Awareness",
    qs: 300,
    acc: 0.72,
    sec: 18,
  },
  {
    id: "t17",
    name: "Current Affairs",
    section: "General Awareness",
    qs: 420,
    acc: 0.58,
    sec: 15,
  },
  {
    id: "t18",
    name: "Static GK",
    section: "General Awareness",
    qs: 210,
    acc: 0.51,
    sec: 17,
  },
  {
    id: "t19",
    name: "Computer Fundamentals",
    section: "Computer Aptitude",
    qs: 130,
    acc: 0.83,
    sec: 16,
  },
];

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
    short: "Fast and accurate — bank these in the opening minutes",
    advice:
      "Accurate and fast. These are your marks. Clear every one of them before the paper gets interesting.",
    dot: "bg-ok",
    ring: "ring-ok/20",
    text: "text-ok",
    chip: "bg-ok-soft text-ok",
  },
  iftime: {
    label: "Attempt if time",
    short: "Right, but expensive — only once the fast marks are banked",
    advice:
      "You get these right but they cost you. Come back once the fast marks are in, and only if the clock allows.",
    dot: "bg-brand",
    ring: "ring-brand/20",
    text: "text-brand",
    chip: "bg-brand-soft text-brand",
  },
  fix: {
    label: "Fix the errors",
    short: "Fast but wrong — the cheapest marks in the paper to recover",
    advice:
      "Fast but wrong, which is careless rather than hard. These are the cheapest marks on the whole map to recover.",
    dot: "bg-warn",
    ring: "ring-warn/20",
    text: "text-warn",
    chip: "bg-warn-soft text-warn",
  },
  skip: {
    label: "Skip in the exam",
    short: `Slow and wrong — at −${NEGATIVE_MARK} they take marks off you`,
    advice: `Slow and wrong. At −${NEGATIVE_MARK} a mark these actively cost you. Practise them at home; leave them in the hall.`,
    dot: "bg-bad",
    ring: "ring-bad/20",
    text: "text-bad",
    chip: "bg-bad-soft text-bad",
  },
};

function zoneOf(t: Topic): Zone {
  const fast = t.sec <= PACE;
  const accurate = t.acc >= ACC_LINE;
  if (fast && accurate) return "first";
  if (!fast && accurate) return "iftime";
  if (fast && !accurate) return "fix";
  return "skip";
}

/* Expected marks per attempt under negative marking. */
function expected(t: Topic) {
  return t.acc - (1 - t.acc) * NEGATIVE_MARK;
}

/* The real ranking: marks earned per minute spent. */
function rate(t: Topic) {
  return (expected(t) / t.sec) * 60;
}

const PACE_PCT = (PACE / MAX_SEC) * 100;
const ACC_PCT = ACC_LINE * 100;

// Plot padding, so a dot at 0 or 100 is not half outside the frame.
const PAD = 7;
const x = (sec: number) => PAD + Math.min(1, sec / MAX_SEC) * (100 - PAD * 2);
const y = (acc: number) => PAD + acc * (100 - PAD * 2);

const X_TICKS = [0, 30, 60, 90];
const Y_TICKS = [0, 25, 50, 75, 100];

type SortKey = "rate" | "acc" | "sec" | "qs";

export function AttemptMapView() {
  const { board } = useApp();
  const [section, setSection] = useState<Subject | "All">("All");
  const [open, setOpen] = useState<Topic | null>(null);
  const [hover, setHover] = useState<Topic | null>(null);
  const [sort, setSort] = useState<SortKey>("rate");
  const [asc, setAsc] = useState(false);

  const shown = useMemo(
    () => TOPICS.filter((t) => section === "All" || t.section === section),
    [section],
  );

  const counts = useMemo(() => {
    const c: Record<Zone, number> = { first: 0, iftime: 0, fix: 0, skip: 0 };
    shown.forEach((t) => (c[zoneOf(t)] += 1));
    return c;
  }, [shown]);

  const stats = useMemo(() => {
    if (!shown.length) return null;
    const paces = [...shown].map((t) => t.sec).sort((a, b) => a - b);
    const median = paces[Math.floor(paces.length / 2)];
    const banked = shown.filter((t) => zoneOf(t) === "first");
    const mapRate = banked.length
      ? banked.reduce((s, t) => s + rate(t), 0) / banked.length
      : 0;
    const blindRate = shown.reduce((s, t) => s + rate(t), 0) / shown.length;
    return {
      median,
      banked: banked.length,
      skip: shown.filter((t) => zoneOf(t) === "skip").length,
      mapRate,
      blindRate,
    };
  }, [shown]);

  const skipList = useMemo(
    () =>
      [...shown]
        .filter((t) => zoneOf(t) === "skip")
        .sort((a, b) => rate(a) - rate(b))
        .slice(0, 5),
    [shown],
  );

  const table = useMemo(() => {
    const get = (t: Topic) =>
      sort === "rate"
        ? rate(t)
        : sort === "acc"
          ? t.acc
          : sort === "sec"
            ? t.sec
            : t.qs;
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

  return (
    <div data-companion>
      <PageHeader
        title="Attempt map"
        sub={`Every topic placed by accuracy against the seconds it costs you. With −${NEGATIVE_MARK} for a wrong answer, the bottom-right corner takes marks off you. That corner is your skip list.`}
        actions={
          <Segmented
            value={section}
            options={["All", ...SECTIONS] as const}
            onChange={(v) => {
              setSection(v);
              setOpen(null);
            }}
            labels={{ ...SECTION_LABEL, All: "All" }}
          />
        }
      />

      {stats ? (
        <div className="border-line mb-10 grid grid-cols-1 border-t border-l sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Marks per minute"
            value={stats.mapRate.toFixed(2)}
            note={`${stats.blindRate.toFixed(2)} if you attempt everything`}
          />
          <Stat
            label="Bankable topics"
            value={String(stats.banked)}
            note="fast and accurate — clear these first"
          />
          <Stat
            label="On your skip list"
            value={String(stats.skip)}
            note="slow and wrong under negative marking"
          />
          <Stat
            label="Median pace"
            value={`${stats.median}s`}
            note={`target is ${PACE}s a question`}
          />
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionTitle
            aside={
              <span className="text-ink-3 text-[12px]">
                {shown.length} topics · {board} · bubble size is volume
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
                  style={{ bottom: `${y(v / 100)}%` }}
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
                    style={{ bottom: `${y(v / 100)}%` }}
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

                {/* The two corners that carry an instruction get a wash; the
                    other two are neutral so the eye goes to these first. */}
                <span
                  className="bg-ok/[0.06] absolute top-0 left-0"
                  style={{ width: `${PACE_PCT}%`, height: `${100 - ACC_PCT}%` }}
                  aria-hidden
                />
                <span
                  className="bg-bad/[0.045] absolute right-0 bottom-0"
                  style={{
                    width: `${100 - PACE_PCT}%`,
                    height: `${ACC_PCT}%`,
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
                  {ACC_PCT}% accuracy
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
                      style={{ left: `${x(focus.sec)}%` }}
                      aria-hidden
                    />
                    <span
                      className="bg-ink/20 pointer-events-none absolute inset-x-0 h-px"
                      style={{ bottom: `${y(focus.acc)}%` }}
                      aria-hidden
                    />
                  </>
                ) : null}

                {shown.map((t, i) => {
                  const z = zoneOf(t);
                  const isOpen = open?.id === t.id;
                  const isFocus = focus?.id === t.id;
                  // Bubble size carries volume: a big slow bubble is a bigger
                  // problem than a small one.
                  const r = Math.round(14 + (t.qs / 420) * 16);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOpen(isOpen ? null : t)}
                      onMouseEnter={() => setHover(t)}
                      aria-label={`${t.name}: ${Math.round(t.acc * 100)} percent at ${t.sec} seconds`}
                      className="group absolute z-20 -translate-x-1/2 translate-y-1/2"
                      style={{
                        left: `${x(t.sec)}%`,
                        bottom: `${y(t.acc)}%`,
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
                        {t.name}
                        <span className="tnum ml-1.5 text-white/60">
                          {Math.round(t.acc * 100)}% · {t.sec}s
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-1.5 h-4">
                {X_TICKS.map((v) => (
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
        </Card>

        <div className="grid content-start gap-5">
          {open ? (
            <Card>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] leading-snug tracking-[-0.02em]">
                    {open.name}
                  </p>
                  <p className="text-ink-3 mt-1.5 flex items-center gap-1.5 text-[13px]">
                    <i
                      className="size-2 rounded-full"
                      style={{
                        background: `var(--color-${SECTION_KEY[open.section]})`,
                      }}
                      aria-hidden
                    />
                    {SECTION_LABEL[open.section]} · {open.qs} attempted
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
                      `${Math.round(open.acc * 100)}%`,
                      open.acc < ACC_LINE,
                    ],
                    ["Your pace", `${open.sec}s`, open.sec > PACE],
                    [
                      "Marks per attempt",
                      `${expected(open) >= 0 ? "+" : ""}${expected(open).toFixed(2)}`,
                      expected(open) < 0.4,
                    ],
                    [
                      "Marks per minute",
                      rate(open).toFixed(2),
                      rate(open) < 0.6,
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
                Drill this topic
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
                  Nothing in this section lands in the skip corner. Attempt it
                  in full and spend the saved time on{" "}
                  {SECTION_LABEL[SECTIONS[2]]}.
                </p>
              ) : (
                <ol className="grid gap-3">
                  {skipList.map((t, i) => (
                    <li key={t.id}>
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
                            {t.name}
                          </span>
                          <span className="tnum text-ink-3 block text-[13px]">
                            {Math.round(t.acc * 100)}% at {t.sec}s
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
                Every one of these earns less per minute than the worst topic in
                your bankable corner. Attempting them is not brave, it is a
                trade you lose.
              </p>
            </Card>
          )}

          <Card className="bg-ink text-white">
            <p className="text-[14px] text-white/50">What this changes</p>
            <p className="mt-4 text-[15px] leading-[1.55] text-white/85">
              Attempt the map in order and you earn{" "}
              <span className="tnum text-white">
                {stats ? stats.mapRate.toFixed(2) : "—"}
              </span>{" "}
              marks a minute instead of{" "}
              <span className="tnum text-white">
                {stats ? stats.blindRate.toFixed(2) : "—"}
              </span>
              . Over a 60-minute prelims that is roughly{" "}
              <span className="tnum text-white">
                {stats
                  ? `${Math.round((stats.mapRate - stats.blindRate) * 60)} marks`
                  : "—"}
              </span>{" "}
              you are currently leaving on the table.
            </p>
            <Link
              href="/mocks"
              className="rounded-pill text-ink mt-7 flex h-10 items-center justify-center bg-white text-[14px] transition-opacity hover:opacity-90"
            >
              Sit a mock and test it
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
                <SortHead k="qs" sort={sort} asc={asc} onClick={toggleSort} />
                <SortHead k="acc" sort={sort} asc={asc} onClick={toggleSort} />
                <SortHead k="sec" sort={sort} asc={asc} onClick={toggleSort} />
                <SortHead k="rate" sort={sort} asc={asc} onClick={toggleSort} />
                <th className="py-3.5 pr-6 pl-3" />
              </tr>
            </thead>
            <tbody>
              {table.map((t) => {
                const z = zoneOf(t);
                return (
                  <tr
                    key={t.id}
                    onMouseEnter={() => setHover(t)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setOpen(t)}
                    className={`border-line cursor-pointer border-b transition-colors last:border-0 ${
                      open?.id === t.id
                        ? "bg-brand-soft/60"
                        : "hover:bg-brand-soft/40"
                    }`}
                  >
                    <td className="py-4 pr-3 pl-6">
                      <span className="flex items-center gap-2.5">
                        <i
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            background: `var(--color-${SECTION_KEY[t.section]})`,
                          }}
                          aria-hidden
                        />
                        <span className="text-[14.5px]">{t.name}</span>
                        <span className="text-ink-4 text-[13px]">
                          {SECTION_LABEL[t.section]}
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
                      {t.qs}
                    </td>
                    <td className="tnum px-3 py-4 text-right text-[14px]">
                      {Math.round(t.acc * 100)}%
                    </td>
                    <td
                      className={`tnum px-3 py-4 text-right text-[14px] ${t.sec > PACE ? "text-bad" : "text-ok"}`}
                    >
                      {t.sec}s
                    </td>
                    <td className="tnum px-3 py-4 text-right text-[14px]">
                      {rate(t).toFixed(2)}
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
  qs: "Attempted",
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
