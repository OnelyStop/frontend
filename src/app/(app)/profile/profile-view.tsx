"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  ButtonLink,
  Card,
  Empty,
  PageHeader,
  SectionTitle,
  StatusPill,
  Tile,
} from "@/design-system";
import { SECTION_LABEL } from "@/data/navigation";
import {
  SectionBands,
  rankSections,
} from "@/features/attempts/components/SectionBands";
import { SittingCard } from "@/features/attempts/components/SittingCard";
import type {
  Progress,
  ProfileStats,
  RecentAttempt,
} from "@/features/attempts/progress.server";
import { PACE_TARGET } from "@/features/attempts/verdict";
import { PLAN_LIMITS, PLAN_NAME } from "@/features/billing/limits";
import type { Entitlement } from "@/features/billing/types";
import type { PeriodUsage } from "@/features/billing/usage.server";
import { AVATARS, isAvatarKey } from "@/features/profile/avatars";
import type { Profile } from "@/features/profile/types";

// A fixed zone and locale: toLocaleDateString() picks the runtime's and mismatches on hydration.
const DAY = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});
const MONTH_YEAR = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const USAGE_ROWS: { key: keyof PeriodUsage; label: string; per: string }[] = [
  { key: "mocksPerMonth", label: "Mocks started", per: "this month" },
  { key: "drillsPerDay", label: "Drills started", per: "today" },
  { key: "askOnelyPerMonth", label: "Ask Onely", per: "this month" },
  {
    key: "descriptiveMarkingsPerMonth",
    label: "Descriptive markings",
    per: "this month",
  },
];

function Meter({
  label,
  per,
  used,
  limit,
}: {
  label: string;
  per: string;
  used: number;
  limit: number | null;
}) {
  const full = limit !== null && used >= limit;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-ink-2">
          {label} <span className="text-ink-3">· {per}</span>
        </span>
        <span className={`tnum font-medium ${full ? "text-bad" : "text-ink"}`}>
          {used}
          <span className="text-ink-3 font-normal">
            {" "}
            / {limit === null ? "unlimited" : limit}
          </span>
        </span>
      </div>
      <div className="bg-ink/8 mt-2 h-1.5 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${full ? "bg-bad" : "bg-frame"}`}
          style={{
            width:
              limit === null
                ? "100%"
                : `${Math.min(100, (used / Math.max(1, limit)) * 100)}%`,
            opacity: limit === null ? 0.18 : 1,
          }}
        />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-line flex items-baseline justify-between gap-4 border-b py-3 last:border-b-0">
      <dt className="text-ink-3 text-[13px]">{label}</dt>
      <dd
        className={`text-right text-[14px] ${value ? "text-ink" : "text-ink-4"}`}
      >
        {value ?? "Not set"}
      </dd>
    </div>
  );
}

export function ProfileView({
  profile,
  stats,
  progress,
  recent,
  entitlement,
  usage,
}: {
  profile: Profile | null;
  stats: ProfileStats;
  progress: Progress;
  recent: RecentAttempt[];
  entitlement: Entitlement;
  usage: PeriodUsage;
}) {
  const { avatar } = useApp();
  const { user } = useAuth();
  const board = profile?.examBoard ?? "IBPS PO";
  const sittings = stats.mocksSat + stats.drillsSat;
  // Same fallback as the running head, so the face here matches the one in the corner.
  const look =
    AVATARS[
      isAvatarKey(profile?.avatar) ? profile.avatar : (avatar ?? "indigo")
    ];
  const limits = PLAN_LIMITS[entitlement.plan];
  const accuracy =
    progress.attempted === 0
      ? null
      : Math.round((progress.correct / progress.attempted) * 100);
  const ranked = rankSections(progress.sections, "best");

  return (
    <>
      <PageHeader
        title="Profile"
        sub={`Your record card for ${board}: who you are on onelystop, what you have sat, and what your plan leaves you this month.`}
        actions={
          <ButtonLink href="/settings" variant="secondary" size="sm">
            Edit in settings
          </ButtonLink>
        }
      />

      <Card className="flex flex-wrap items-center gap-5 sm:gap-6">
        <span
          className="grid size-20 shrink-0 place-items-center rounded-full text-[36px]"
          style={{
            background: look.wash,
            boxShadow: `inset 0 0 0 2px ${look.ink}33`,
          }}
          aria-hidden
        >
          {look.face}
        </span>

        <div className="min-w-60 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[22px] font-semibold tracking-[-0.02em]">
              {profile?.displayName ?? "Your profile"}
            </p>
            <StatusPill
              tone={entitlement.plan === "free" ? "neutral" : "brand"}
            >
              {PLAN_NAME[entitlement.plan]}
            </StatusPill>
          </div>
          {user?.email ? (
            <p className="text-ink-3 mt-0.5 text-[14px]">{user.email}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              board,
              profile?.targetYear ? `Sitting ${profile.targetYear}` : null,
              profile?.school,
              user?.created_at
                ? `Member since ${MONTH_YEAR.format(new Date(user.created_at))}`
                : null,
            ]
              .filter((chip): chip is string => Boolean(chip))
              .map((chip) => (
                <span
                  key={chip}
                  className="bg-panel text-ink-2 rounded-pill px-3 py-1 text-[12.5px]"
                >
                  {chip}
                </span>
              ))}
          </div>
        </div>

        {profile?.bio ? (
          <p className="border-line text-ink-2 w-full max-w-[46ch] text-[14px] leading-relaxed lg:w-auto lg:border-l lg:pl-6">
            {profile.bio}
          </p>
        ) : null}
      </Card>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          {sittings === 0 ? (
            <Card pad={false}>
              <Empty
                title="No sittings yet"
                sub="Your record card fills in from submitted attempts: how many mocks and drills you have sat, your best paper score, your accuracy and your section split."
                action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
              />
            </Card>
          ) : (
            <>
              <Card>
                <SectionTitle aside="all time, and the last 30 days">
                  Record
                </SectionTitle>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <Tile
                    value={String(stats.mocksSat)}
                    label="Mocks sat"
                    tone="info"
                  />
                  <Tile
                    value={String(stats.drillsSat)}
                    label="Drills sat"
                    tone="ok"
                  />
                  <Tile
                    value={
                      stats.bestScore === null
                        ? "—"
                        : stats.bestScore.toFixed(2)
                    }
                    label="Best mock score"
                    tone="brand"
                  />
                  <Tile
                    value={
                      stats.lastSatAt === null
                        ? "—"
                        : DAY.format(new Date(stats.lastSatAt))
                    }
                    label="Last sitting"
                    tone="warn"
                  />
                  <Tile
                    value={accuracy === null ? "—" : `${accuracy}%`}
                    label="Accuracy · 30 days"
                    tone="neutral"
                    outline={accuracy === null}
                  />
                  <Tile
                    value={
                      progress.avgSec === null ? "—" : `${progress.avgSec}s`
                    }
                    label={`A question · ${PACE_TARGET}s budget`}
                    tone={
                      progress.avgSec !== null && progress.avgSec <= PACE_TARGET
                        ? "ok"
                        : "neutral"
                    }
                    outline={progress.avgSec === null}
                  />
                </div>
              </Card>

              <Card>
                <SectionTitle
                  aside={
                    <Link
                      href="/progress"
                      className="hover:text-ink inline-flex items-center gap-1"
                    >
                      Full progress <ArrowRight size={13} />
                    </Link>
                  }
                >
                  Sections, strongest first
                </SectionTitle>
                {ranked.length ? (
                  <SectionBands sections={ranked} attempted />
                ) : (
                  <p className="text-ink-3 text-[13px]">
                    Nothing submitted in the last 30 days, so there is no split
                    to show yet.
                  </p>
                )}
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-5">
          <Card>
            <SectionTitle
              aside={
                <Link
                  href="/upgrade"
                  className="hover:text-ink inline-flex items-center gap-1"
                >
                  Manage plan <ArrowRight size={13} />
                </Link>
              }
            >
              {PLAN_NAME[entitlement.plan]} plan
            </SectionTitle>
            <p className="text-ink-3 -mt-3 mb-5 text-[13px]">
              {entitlement.plan === "free"
                ? "Free forever. Limits reset on the 1st of each month, drills at midnight."
                : entitlement.accessUntil
                  ? `Access until ${DAY.format(new Date(entitlement.accessUntil))}.`
                  : "Full access."}
            </p>
            <div className="grid gap-4">
              {USAGE_ROWS.map(({ key, label, per }) => (
                <Meter
                  key={key}
                  label={label}
                  per={per}
                  used={usage[key]}
                  limit={limits[key]}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              aside={
                <Link
                  href="/settings"
                  className="hover:text-ink inline-flex items-center gap-1"
                >
                  Change <ArrowRight size={13} />
                </Link>
              }
            >
              Preparing for
            </SectionTitle>
            <dl className="-mt-3">
              <Detail label="Exam" value={board} />
              <Detail
                label="Target year"
                value={profile?.targetYear ? String(profile.targetYear) : null}
              />
              <Detail
                label="Opens on"
                value={
                  profile?.defaultSection
                    ? SECTION_LABEL[profile.defaultSection]
                    : null
                }
              />
              <Detail
                label="Coaching / college"
                value={profile?.school ?? null}
              />
            </dl>
          </Card>

          {recent.length ? (
            <Card>
              <SectionTitle aside="last 30 days">Recent sittings</SectionTitle>
              <div className="grid gap-2.5">
                {recent.map((s) => (
                  <SittingCard key={s.id} sitting={s} />
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
