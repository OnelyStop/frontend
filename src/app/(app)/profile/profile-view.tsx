"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Card, PageHeader, SectionTitle } from "@/design-system";
import { SECTION_KEY, SECTION_SHORT, SECTIONS } from "@/data/navigation";

/* A profile here is a record card, not a social page: what you have sat, what
   cleared, and where the marks went. */

const SITTINGS = [
  { paper: "IBPS PO Prelims · Mock 14", date: "26 Aug", score: 58.5, cleared: 4 },
  { paper: "SBI PO Prelims · Mock 09", date: "22 Aug", score: 54.25, cleared: 3 },
  { paper: "IBPS PO Prelims · Mock 13", date: "18 Aug", score: 61.0, cleared: 5 },
  { paper: "IBPS Clerk Prelims · Mock 06", date: "14 Aug", score: 66.75, cleared: 5 },
];

const SECTION_BEST = [72, 68, 54, 81, 88];

export function ProfileView() {
  const { profile, board, streak, points, initials } = useApp();

  return (
    <>
      <PageHeader
        title="Profile"
        sub={`Your record card for ${board} — what you have sat, what cleared, and where the marks went.`}
        actions={
          <Link
            href="/settings"
            className="inline-flex h-9 items-center rounded-ctl border border-line bg-canvas px-3.5 text-[14px] font-medium transition-colors hover:border-line-2"
          >
            Edit in settings
          </Link>
        }
      />

      <Card className="flex flex-wrap items-center gap-5">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-full bg-ink text-xl text-white"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-[200px] flex-1">
          <p className="text-[20px]">{profile.name}</p>
          <p className="mt-0.5 text-[14px] text-ink-3">{profile.email}</p>
          <p className="text-[14px] text-ink-3">
            {profile.school} · Target {profile.examYear}
          </p>
        </div>
        {profile.bio ? (
          <p className="max-w-[46ch] border-l border-line pl-5 text-[14px] leading-relaxed text-ink-2">
            {profile.bio}
          </p>
        ) : null}
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          ["Day streak", String(streak)],
          ["Mocks sat", String(SITTINGS.length)],
          ["Best score", "66.75"],
          ["Points", points.toLocaleString("en-IN")],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <div className="tnum text-[28px] leading-none">
              {value}
            </div>
            <div className="mt-2 text-[13px] text-ink-3">{label}</div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <SectionTitle>Best sectional score</SectionTitle>
          <div className="flex items-end gap-3">
            {SECTIONS.map((s, i) => (
              <div key={s} className="flex-1 text-center">
                <div className="flex h-32 items-end">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${SECTION_BEST[i]}%`,
                      background: `var(--color-${SECTION_KEY[s]})`,
                    }}
                  />
                </div>
                <div className="tnum mt-2 text-[13px]">
                  {SECTION_BEST[i]}
                </div>
                <div className="text-[12px] text-ink-4">{SECTION_SHORT[s]}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false}>
          <div className="px-6 pb-2 pt-6">
            <SectionTitle>Recent sittings</SectionTitle>
          </div>
          <div className="divide-y divide-line">
            {SITTINGS.map((s) => (
              <div key={s.paper} className="flex items-center gap-4 px-6 py-4">
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                  {s.paper}
                </span>
                <span className="tnum shrink-0 text-[13px] text-ink-3">
                  {s.date}
                </span>
                <span
                  className={`tnum shrink-0 rounded-pill px-2 py-0.5 text-[11.5px] font-medium ${
                    s.cleared === 5
                      ? "bg-ok-soft text-ok"
                      : "bg-warn-soft text-warn"
                  }`}
                >
                  {s.cleared}/5 cleared
                </span>
                <span className="tnum w-14 shrink-0 text-right text-[15px]">
                  {s.score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
