"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { ButtonLink, Card, Empty, PageHeader } from "@/design-system";
import type { ProfileStats } from "@/features/attempts/progress.server";
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

export function ProfileView({
  profile,
  stats,
}: {
  profile: Profile | null;
  stats: ProfileStats;
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
          <Link
            href="/settings"
            className="rounded-ctl border-line bg-canvas hover:border-line-2 inline-flex h-9 items-center border px-3.5 text-[14px] font-medium transition-colors"
          >
            Edit in settings
          </Link>
        }
      />

      <Card className="flex flex-wrap items-center gap-5">
        <span
          className="bg-ink grid size-16 shrink-0 place-items-center rounded-full text-xl text-white"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-50 flex-1">
          <p className="text-[20px]">
            {profile?.displayName ?? "Your profile"}
          </p>
          <p className="text-ink-3 mt-0.5 text-[14px]">{board}</p>
          <p className="text-ink-3 text-[14px]">
            {[
              profile?.school,
              profile?.targetYear && `Target ${profile.targetYear}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Add your details in settings"}
          </p>
        </div>
        {profile?.bio ? (
          <p className="border-line text-ink-2 max-w-[46ch] border-l pl-5 text-[14px] leading-relaxed">
            {profile.bio}
          </p>
        ) : null}
      </Card>

      {sittings === 0 ? (
        <Card className="mt-5" pad={false}>
          <Empty
            title="No sittings yet"
            sub="Your record card fills in from submitted attempts — how many mocks and drills you have sat, your best paper score, and when you last sat one."
            action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
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
            <Card key={label} className="p-5">
              <div className="tnum text-[28px] leading-none">{value}</div>
              <div className="text-ink-3 mt-2 text-[13px]">{label}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
