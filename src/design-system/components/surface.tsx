import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../lib/cn";

// White paper or black — a card filled with a state colour makes the tint a container, and the state stops being findable.
export type CardTone = "plain" | "ink";

const CARD_TONE: Record<CardTone, string> = {
  plain: "",
  ink: "bg-ink text-white",
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
        "border-line bg-canvas text-ink shadow-pop absolute top-11 z-50 rounded-[18px] border p-1.5",
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
    <Link
      href={href}
      role="menuitem"
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={classes}
    >
      {body}
    </Link>
  ) : (
    <button type="button" role="menuitem" onClick={onClick} className={classes}>
      {body}
    </button>
  );
}
