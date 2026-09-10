import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "brand";

const TONE: Record<Tone, string> = {
  neutral: "bg-panel text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  brand: "bg-brand-soft text-brand",
};

// `outline` is the not-yet state — no fill, because nothing has happened yet.
export function Tile({
  value,
  label,
  tone = "info",
  outline,
}: {
  value: string;
  label: string;
  tone?: Tone;
  outline?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-2 py-4 text-center",
        outline ? "border-line-2 border-2 border-dashed" : TONE[tone],
      )}
    >
      <p className="tnum text-[22px] leading-none font-bold tracking-[-0.02em]">
        {value}
      </p>
      {/* Balanced, so a two-line label splits evenly instead of leaving one word stranded. */}
      <p className="text-ink-2 mt-2 text-[12.5px] text-balance">{label}</p>
    </div>
  );
}

// `warn` keeps the number in plain ink: amber is a rule you notice, not a figure you read.
const FIGURE_TONE: Record<"ok" | "warn" | "bad", [rule: string, ink: string]> =
  {
    ok: ["border-ok", "text-ok"],
    warn: ["border-warn", "text-ink"],
    bad: ["border-bad", "text-bad"],
  };

/** A supporting figure: a coloured rule carries the state, so the number does not need a box around it. */
export function Figure({
  value,
  tone,
  children,
  className,
}: {
  value: string;
  tone: keyof typeof FIGURE_TONE;
  children: ReactNode;
  className?: string;
}) {
  const [rule, ink] = FIGURE_TONE[tone];
  return (
    <div className={cn("border-l-2 pl-4", rule, className)}>
      <p
        className={cn("tnum text-[23px] leading-none tracking-[-0.03em]", ink)}
      >
        {value}
      </p>
      <p className="text-ink-3 mt-1.5 max-w-[26ch] text-[13px] leading-relaxed">
        {children}
      </p>
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
  // Cleared by a hair and cleared comfortably are different facts; one colour hid that.
  const ratio = value === null || target === 0 ? 0 : value / target;
  const band = ratio >= 1.1 ? "bg-ok" : ratio >= 1 ? "bg-warn" : "bg-bad";
  const pct = (n: number) =>
    `${Math.max(0, Math.min(100, (n / scale) * 100))}%`;

  return (
    // Track and ring are translucent, not solid: a bar on a tinted card kept the grey track and a white gash for a notch.
    <div
      className={cn(
        "rounded-pill bg-ink/10 relative h-4 overflow-visible",
        className,
      )}
    >
      {value !== null ? (
        <div
          className={cn(
            "rounded-pill h-full transition-[width] duration-500 ease-[var(--ease-decelerate)]",
            band,
          )}
          style={{ width: pct(value) }}
        />
      ) : null}
      <span
        className="bg-ink absolute -top-2 -bottom-2 w-1 rounded-full ring-2 ring-white/75"
        style={{ left: pct(target) }}
        aria-hidden
      />
    </div>
  );
}

/** A mark on a tinted disc — the same face the avatar stack overlaps. */
export function Avatar({
  children,
  tint,
  size = 36,
  className,
}: {
  children: ReactNode;
  /** A canvas tint; falls back to the recessed grey. */
  tint?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        fontSize: size / 2.1,
        background: tint ?? "var(--color-panel)",
      }}
      className={cn("grid shrink-0 place-items-center rounded-full", className)}
      aria-hidden
    >
      {children}
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
