import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/* Data display. Colour here is functional: green means earned, red means it
   costs you, amber means partial. Nothing is coloured for decoration. */

export type Tone = "neutral" | "ok" | "warn" | "bad" | "brand";

const TONE: Record<Tone, string> = {
  neutral: "bg-line text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  brand: "bg-brand-soft text-brand",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-[12.5px]",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Label, one large number, one line of context. Sits inside a LatticeCell. */
export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <>
      <p className="text-[14px] text-ink-2">{label}</p>
      <p className="tnum mt-3 text-[38px] leading-none tracking-[-0.03em]">
        {value}
      </p>
      {note ? (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{note}</p>
      ) : null}
    </>
  );
}

/** A plain proportion — one weight, no threshold. */
export function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-pill bg-line", className)}>
      <div
        className="h-full rounded-pill bg-ink"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* A score is only ever read against its cutoff, never against a maximum — so
   the track carries a notch, and the fill turns red only when it misses. */
export function CutoffBar({
  value,
  cutoff,
  max,
  className,
}: {
  value: number | null;
  cutoff: number;
  /** Defaults to a little past whichever of the two is larger. */
  max?: number;
  className?: string;
}) {
  const scale = max ?? Math.max(cutoff, value ?? 0) * 1.3;
  const cleared = value !== null && value >= cutoff;
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / scale) * 100))}%`;

  return (
    <div className={cn("relative h-1.5 rounded-pill bg-line", className)}>
      {value !== null ? (
        <div
          className={cn("h-full rounded-pill", cleared ? "bg-ink" : "bg-bad")}
          style={{ width: pct(value) }}
        />
      ) : null}
      <span
        className="absolute -top-1 h-[14px] w-px bg-ink-3"
        style={{ left: pct(cutoff) }}
        aria-hidden
      />
    </div>
  );
}

export function Avatar({
  initials,
  size = 40,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size / 3 }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-line-2",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-pill border border-line px-2 py-0.5 text-[11px] text-ink-3">
      {children}
    </kbd>
  );
}

/* Tables sit inside a Card with pad={false}: header on a hairline, rows on
   hairlines, no zebra fill. */
export function Table({
  head,
  children,
  minWidth = 720,
}: {
  head: ReactNode;
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        style={{ minWidth }}
        className="w-full border-collapse text-left"
      >
        <thead>
          <tr className="border-y border-line text-[13px] text-ink-3">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3.5 font-normal first:pl-6 last:pr-6",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 py-4 text-[14px] first:pl-6 last:pr-6",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  active,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "border-b border-line last:border-0",
        onClick && "cursor-pointer transition-colors",
        active ? "bg-brand-soft/60" : onClick && "hover:bg-brand-soft/40",
      )}
    >
      {children}
    </tr>
  );
}
