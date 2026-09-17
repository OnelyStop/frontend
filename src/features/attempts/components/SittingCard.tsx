import Link from "next/link";
import { StatusPill } from "@/design-system";
import type { RecentAttempt } from "../progress.server";

const WHEN = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function SittingCard({ sitting }: { sitting: RecentAttempt }) {
  const paper = sitting.mode === "paper";
  const cleared =
    paper && sitting.score !== null && sitting.target !== null
      ? sitting.score >= sitting.target
      : null;
  const score =
    sitting.score === null
      ? "text-ink-4"
      : cleared === null
        ? "text-ink"
        : cleared
          ? "text-ok"
          : "text-bad";

  return (
    <li className="border-line hover:bg-brand-soft/30 border-b px-2 transition-colors">
      <Link
        href={`/results/${sitting.id}`}
        className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">
            {sitting.paper ?? "Drill"}
          </p>
          <p className="tnum text-ink-3 mt-1 text-[12.5px]">
            {WHEN.format(new Date(sitting.submittedAt))} · {sitting.questions}{" "}
            questions
          </p>
        </div>
        <span
          className={`tnum shrink-0 text-[20px] leading-none font-semibold tracking-[-0.03em] ${score}`}
        >
          {sitting.score ?? "—"}
        </span>
        {cleared !== null ? (
          <StatusPill tone={cleared ? "ok" : "bad"}>
            {cleared ? "Cleared" : "Missed"}
          </StatusPill>
        ) : null}
      </Link>
    </li>
  );
}
