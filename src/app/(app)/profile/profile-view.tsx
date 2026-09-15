"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ButtonLink,
  Card,
  Empty,
  PageHeader,
  SectionTitle,
  Stat,
} from "@/design-system";
import { SittingCard } from "@/features/attempts/components/SittingCard";
import type {
  ProfileStats,
  RecentAttempt,
} from "@/features/attempts/progress.server";
import { PLAN_NAME, type PlanTier } from "@/features/billing/limits";
import type { UsageRow } from "@/features/billing/usage.server";
import type { Profile } from "@/features/profile/types";

// toLocaleDateString() formats per runtime locale and mismatches on hydration.
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

const PERIOD_NOTE: Record<UsageRow["per"], string> = {
  day: "today",
  month: "this month",
  account: "in total",
};

// Rows on the stage, not a second card: the page already spends its one card on the record card above.
function Allowance({ rows, plan }: { rows: UsageRow[]; plan: PlanTier }) {
  if (rows.length === 0) return null;

  return (
    <>
      <SectionTitle className="mt-10" aside={`On ${PLAN_NAME[plan]}`}>
        What you have used
      </SectionTitle>

      <div className="ruled">
        {rows.map(({ key, label, used, cap, per }) => {
          const left = Math.max(cap - used, 0);
          return (
            <div
              key={key}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
            >
              <span className="text-[14.5px]">{label}</span>
              <span className="text-ink-3 w-full text-[12.5px] sm:order-last sm:w-auto">
                {left === 0 ? "none left" : `${left} left`} · {PERIOD_NOTE[per]}
              </span>
              <span className="tnum text-[14.5px] font-medium">
                {used} of {cap}
              </span>
            </div>
          );
        })}
      </div>

      {plan === "free" ? (
        <p className="text-ink-3 mt-3 text-[13px] leading-relaxed">
          Pro lifts mocks and drills to unlimited and opens the whole knowledge
          base. Pro+ raises the marking and Ask Onely numbers furthest.{" "}
          <Link
            href="/upgrade"
            className="text-ink underline underline-offset-2"
          >
            See the plans
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function ProfileView({
  profile,
  stats,
  recent,
  usage,
  plan,
}: {
  profile: Profile | null;
  stats: ProfileStats;
  recent: RecentAttempt[];
  usage: UsageRow[];
  plan: PlanTier;
}) {
  const { initials } = useApp();
  const board = profile?.examBoard ?? "IBPS PO";
  const sittings = stats.mocksSat + stats.drillsSat;

  return (
    <>
      <PageHeader
        title="Profile"
        sub={`Your record card for ${board} — what you have sat and what it scored.`}
        actions={
          <ButtonLink href="/settings" variant="secondary" size="sm">
            Edit in settings
          </ButtonLink>
        }
      />

      <Card tone="ink" className="flex flex-wrap items-center gap-6 px-7 py-8">
        <span
          className="text-ink grid size-16 shrink-0 place-items-center rounded-full bg-white text-xl font-semibold"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-50 flex-1">
          <p className="text-[20px] tracking-[-0.02em]">
            {profile?.displayName ?? "Your profile"}
          </p>
          <p className="mt-1 text-[13px] text-white/50">{board}</p>
          <p className="text-[13px] text-white/50">
            {[
              profile?.school,
              profile?.targetYear && `Target ${profile.targetYear}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Add your details in settings"}
          </p>
        </div>
        {profile?.bio ? (
          <p className="max-w-[46ch] border-l border-white/20 pl-6 text-[13.5px] leading-[1.6] text-white/75">
            {profile.bio}
          </p>
        ) : null}
      </Card>

      {sittings === 0 ? (
        <Empty
          title="No sittings yet"
          sub="Your record card fills in from submitted attempts — how many mocks and drills you have sat, your best paper score, and when you last sat one."
          action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
        />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              ["Mocks sat", String(stats.mocksSat)],
              ["Drills sat", String(stats.drillsSat)],
              [
                "Best score",
                stats.bestScore === null ? "—" : stats.bestScore.toFixed(2),
              ],
              [
                "Last sitting",
                stats.lastSatAt === null ? "—" : fmtDate(stats.lastSatAt),
              ],
            ].map(([label, value]) => (
              <Stat key={label} value={String(value)} label={String(label)} />
            ))}
          </div>

          <Allowance rows={usage} plan={plan} />

          <SectionTitle
            className="mt-10"
            aside={`${sittings} in all · newest first`}
          >
            Everything you have sat
          </SectionTitle>
          <div className="grid gap-3 lg:grid-cols-2">
            {recent.map((s) => (
              <SittingCard key={s.id} sitting={s} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
