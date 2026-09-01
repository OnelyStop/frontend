"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, PageHeader, SectionTitle } from "@/design-system";
import { SECTION_LABEL, SECTIONS } from "@/data/navigation";

/* Today. The whole screen answers one question: what do I do in the next hour,
   and why that. Sectional readiness against cutoff drives the answer. */

const SECTION_STATE = [
  { s: SECTIONS[0], score: 62, cutoff: 55, trend: +4 },
  { s: SECTIONS[1], score: 71, cutoff: 58, trend: +2 },
  { s: SECTIONS[2], score: 49, cutoff: 52, trend: -3 },
  { s: SECTIONS[3], score: 58, cutoff: 50, trend: +7 },
  { s: SECTIONS[4], score: 80, cutoff: 45, trend: 0 },
];

const PLAN = [
  {
    n: 1,
    kind: "Drill",
    title: "Cloze Test",
    meta: "12 questions · 14 min",
    why: "English is the only section under cutoff, and cloze is where the marks go.",
    href: "/drills",
  },
  {
    n: 2,
    kind: "Revise",
    title: "Current Affairs",
    meta: "30 cards · 9 min",
    why: "Yesterday's set is due. GA moved +7 this week by doing exactly this.",
    href: "/flashcards",
  },
  {
    n: 3,
    kind: "Mock",
    title: "IBPS PO Prelims 2023",
    meta: "Full paper · 1 hr",
    why: "No full timed paper in 11 days. Sectional timing needs the practice.",
    href: "/mocks",
  },
];

const DAYS_LEFT = 43;

export function HomeView() {
  const { board, profile, streak } = useApp();
  const weakest = SECTION_STATE.reduce((a, b) =>
    a.score - a.cutoff < b.score - b.cutoff ? a : b,
  );
  const cleared = SECTION_STATE.filter((r) => r.score >= r.cutoff).length;

  return (
    <>
      <PageHeader
        title={`Good evening, ${profile.name.split(" ")[0]}`}
        sub={`${SECTION_LABEL[weakest.s]} is ${weakest.cutoff - weakest.score} marks under its sectional cutoff — the only section that is. Everything below is ordered around fixing that.`}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <SectionTitle
            aside={`${cleared} of ${SECTION_STATE.length} clearing`}
          >
            Sectional readiness
          </SectionTitle>

          <div className="grid gap-5">
            {SECTION_STATE.map((r) => {
              const safe = r.score >= r.cutoff;
              return (
                <div key={r.s} className="grid gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[14.5px]">{SECTION_LABEL[r.s]}</span>
                    <span className="flex-1" />
                    <span
                      className={`tnum text-[14.5px] ${safe ? "" : "text-bad"}`}
                    >
                      {r.score}
                    </span>
                    <span
                      className={`tnum w-8 text-right text-[13px] ${
                        r.trend > 0
                          ? "text-ok"
                          : r.trend < 0
                            ? "text-bad"
                            : "text-ink-4"
                      }`}
                    >
                      {r.trend > 0 ? `+${r.trend}` : r.trend || "—"}
                    </span>
                  </div>

                  {/* The notch is the cutoff. Only the section that misses it is
                      coloured — colour here means "act", not "category". */}
                  <div className="relative h-1.5 rounded-pill bg-line">
                    <div
                      className={`h-full rounded-pill ${safe ? "bg-ink" : "bg-bad"}`}
                      style={{ width: `${r.score}%` }}
                    />
                    <span
                      className="absolute -top-1 h-[14px] w-px bg-ink-3"
                      style={{ left: `${r.cutoff}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-7 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-3">
            The notch on each track is the sectional cutoff for {board}.
            Clearing every section matters more than a high total — one miss
            ends the attempt regardless of the rest.
          </p>
        </Card>

        <div className="grid content-start gap-4">
          <div className="rounded-card bg-ink p-8 text-white">
            <p className="text-[14px] text-white/50">{board} Prelims</p>
            <p className="tnum mt-4 text-[52px] leading-none tracking-[-0.04em]">
              {DAYS_LEFT}
            </p>
            <p className="mt-2 text-[14px] text-white/60">days to go</p>
            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-[14px]">
              <span className="text-white/60">Current streak</span>
              <span className="tnum">{streak} days</span>
            </div>
          </div>

          <Card>
            <SectionTitle>Where the marks go</SectionTitle>
            <div className="grid gap-4">
              {[
                ["Negative marking", "−4.75", "text-bad"],
                ["Left blank", "9 questions", ""],
                ["Average pace", "43s", "text-ok"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-baseline justify-between">
                  <span className="text-[14px] text-ink-2">{label}</span>
                  <span className={`tnum text-[15px] ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-16">
        <SectionTitle aside="83 min">Your next hour</SectionTitle>

        <div className="grid grid-cols-1 border-l border-t border-line md:grid-cols-3">
          {PLAN.map((p) => (
            <Link
              key={p.n}
              href={p.href}
              className="group relative flex flex-col border-b border-r border-line p-7 transition-colors duration-200 hover:bg-brand-soft/40"
            >
              <div className="flex items-center gap-3">
                <span className="tnum text-[13px] text-ink-4">
                  {String(p.n).padStart(2, "0")}
                </span>
                <span className="text-[13px] text-ink-3">{p.kind}</span>
                <span className="flex-1" />
                <ArrowUpRight
                  size={16}
                  className="text-ink-4 transition-colors group-hover:text-ink"
                />
              </div>

              <p className="mt-8 text-[19px] leading-snug tracking-[-0.02em]">
                {p.title}
              </p>
              <p className="tnum mt-1.5 text-[13px] text-ink-3">{p.meta}</p>
              <p className="mt-5 text-[14px] leading-[1.55] text-ink-2">
                {p.why}
              </p>

              <span
                aria-hidden
                className="absolute bottom-[-2.5px] right-[-2.5px] size-[5px] rounded-full bg-ink-4"
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
