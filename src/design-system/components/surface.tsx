import type { ReactNode } from "react";
import { cn } from "../lib/cn";

// `tone` fills the card when the card itself is what carries the state.

export type CardTone = "plain" | "ok" | "warn" | "bad" | "info" | "active";

const CARD_TONE: Record<CardTone, string> = {
  plain: "",
  ok: "bg-ok-soft",
  warn: "bg-warn-soft",
  bad: "bg-bad-soft",
  info: "bg-info-soft",
  active: "bg-active-soft",
};

export function Card({
  children,
  className,
  pad = true,
  tone = "plain",
  lift,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
  tone?: CardTone;
  lift?: boolean;
}) {
  return (
    <section
      className={cn(
        "card",
        pad && "p-5",
        CARD_TONE[tone],
        lift && "card-lift",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Floating surface: menus, palettes, popovers. The only things that lift. */
export function Popover({
  children,
  label,
  align = "left",
  width = 320,
  className,
}: {
  children: ReactNode;
  label: string;
  align?: "left" | "right";
  width?: number;
  className?: string;
}) {
  return (
    <div
      role="menu"
      aria-label={label}
      style={{ width }}
      className={cn(
        "border-line bg-canvas shadow-pop absolute top-11 z-50 rounded-[18px] border p-1.5",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MenuRow({
  label,
  hint,
  current,
  href,
  onClick,
}: {
  label: string;
  hint?: string;
  current?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const classes = cn(
    "block w-full rounded-ctl px-3 py-2.5 text-left transition-colors",
    current ? "bg-brand-soft" : "hover:bg-brand-soft",
  );
  const body = (
    <>
      <span className="block text-[14px]">{label}</span>
      {hint ? (
        <span className="text-ink-3 mt-0.5 block text-[13px] leading-snug">
          {hint}
        </span>
      ) : null}
    </>
  );

  return href ? (
    <a href={href} role="menuitem" onClick={onClick} className={classes}>
      {body}
    </a>
  ) : (
    <button type="button" role="menuitem" onClick={onClick} className={classes}>
      {body}
    </button>
  );
}
