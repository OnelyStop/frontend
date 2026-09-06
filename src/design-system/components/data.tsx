import type { ReactNode } from "react";
import { cn } from "../lib/cn";

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
        "rounded-pill inline-flex items-center px-2.5 py-1 text-[12.5px]",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

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
      <p className="text-ink-2 text-[14px]">{label}</p>
      <p className="tnum mt-3 text-[38px] leading-none tracking-[-0.03em]">
        {value}
      </p>
      {note ? (
        <p className="text-ink-3 mt-3 text-[13px] leading-relaxed">{note}</p>
      ) : null}
    </>
  );
}

export function Meter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-pill bg-line h-1.5 overflow-hidden", className)}
    >
      <div
        className="rounded-pill bg-ink h-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* A score reads against its target, never a maximum: the notch is the target and the fill turns red only when it misses. */
export function TargetBar({
  value,
  target,
  max,
  className,
}: {
  value: number | null;
  target: number;
  /** Defaults to a little past whichever of the two is larger. */
  max?: number;
  className?: string;
}) {
  const scale = max ?? Math.max(target, value ?? 0) * 1.3;
  const cleared = value !== null && value >= target;
  const pct = (n: number) =>
    `${Math.max(0, Math.min(100, (n / scale) * 100))}%`;

  return (
    <div className={cn("rounded-pill bg-line relative h-1.5", className)}>
      {value !== null ? (
        <div
          className={cn("rounded-pill h-full", cleared ? "bg-ink" : "bg-bad")}
          style={{ width: pct(value) }}
        />
      ) : null}
      <span
        className="bg-ink-3 absolute -top-1 h-3.5 w-px"
        style={{ left: pct(target) }}
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
        "border-line-2 grid shrink-0 place-items-center rounded-full border",
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
    <kbd className="rounded-pill border-line text-ink-3 border px-2 py-0.5 text-[11px]">
      {children}
    </kbd>
  );
}

/* Expects a Card with pad={false} around it; it draws its own hairlines. */
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
      <table style={{ minWidth }} className="w-full border-collapse text-left">
        <thead>
          <tr className="border-line text-ink-3 border-y text-[13px]">
            {head}
          </tr>
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
        "border-line border-b last:border-0",
        onClick && "cursor-pointer transition-colors",
        active ? "bg-brand-soft/60" : onClick && "hover:bg-brand-soft/40",
      )}
    >
      {children}
    </tr>
  );
}
