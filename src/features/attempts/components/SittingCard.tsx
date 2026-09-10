import Link from "next/link";
import { StatusPill } from "@/design-system";
import type { RecentAttempt } from "../progress.server";

const WHEN = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

/** One sitting on the spine: what it was, when, and the one number that matters. */
export function SittingCard({ sitting }: { sitting: RecentAttempt }) {
  const paper = sitting.mode === "paper";
  const cleared =
    paper && sitting.score !== null && sitting.target !== null
      ? sitting.score >= sitting.target
      : null;
  const ink =
    sitting.score === null
      ? "text-ink-4"
      : cleared === null
        ? "text-ink"
        : cleared
          ? "text-ok"
          : "text-bad";

  return (
    <Link
      href={`/results/${sitting.id}`}
      className="card card-lift flex items-center gap-3 rounded-[22px] px-4.5 py-4"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-bold">
          {sitting.paper ?? "Drill"}
        </span>
        <span className="text-ink-3 text-[12.5px]">
          {WHEN.format(new Date(sitting.submittedAt))} · {sitting.questions}{" "}
          questions
        </span>
      </span>
      <span
        className={`tnum text-[20px] font-semibold tracking-[-0.03em] ${ink}`}
      >
        {sitting.score ?? "—"}
      </span>
      {cleared !== null ? (
        <StatusPill tone={cleared ? "ok" : "bad"}>
          {cleared ? "Cleared" : "Missed"}
        </StatusPill>
      ) : null}
    </Link>
  );
}
