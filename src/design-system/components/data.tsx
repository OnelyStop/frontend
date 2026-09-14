import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** A number on the stage under a hairline — never in a box, because a number is not a state. */
export function Stat({
  value,
  label,
  note,
  className,
}: {
  value: string;
  label: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-line border-t pt-3", className)}>
      <p className="tnum text-[23px] leading-none tracking-[-0.03em]">
        {value}
      </p>
      <p className="text-ink-3 mt-2 text-[12.5px] leading-snug">{label}</p>
      {note ? (
        <p className="text-ink-4 mt-1 text-[11.5px] leading-snug">{note}</p>
      ) : null}
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
  max?: number;
  className?: string;
}) {
  const scale = max ?? Math.max(target, value ?? 0) * 1.3;
  const ratio = value === null || target === 0 ? 0 : value / target;
  const band = ratio >= 1.1 ? "bg-ok" : ratio >= 1 ? "bg-warn" : "bg-bad";
  const pct = (n: number) =>
    `${Math.max(0, Math.min(100, (n / scale) * 100))}%`;

  return (
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

export function Avatar({
  children,
  tint,
  size = 36,
  className,
}: {
  children: ReactNode;
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
