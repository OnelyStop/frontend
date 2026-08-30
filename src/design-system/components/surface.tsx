import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/* Surfaces.

   A panel is white ground inside a hairline — no fill, no shadow. Only things
   that genuinely float (menus, palettes) lift. One dark object per screen at
   most, for the payoff. */

export function Card({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={cn("card", pad && "p-8", className)}>{children}</section>
  );
}

export function DarkPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-ink p-8 text-white", className)}>
      {children}
    </section>
  );
}

/* Ruled ground — the signature layout. Cells divided by hairlines with a
   marker on every intersection, rather than objects floating apart. The
   container draws the top and left edge; each cell draws its own bottom and
   right, so any column count works without per-breakpoint rules. */

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export function Lattice({
  children,
  cols = 4,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  return (
    <As className={cn("grid border-l border-t border-line", COLS[cols], className)}>
      {children}
    </As>
  );
}

type CellProps = {
  children: ReactNode;
  className?: string;
  /** Square from two columns up; sizes to content at one. */
  square?: boolean;
  href?: string;
  onClick?: () => void;
  as?: "div" | "li";
};

export function LatticeCell({
  children,
  className,
  square,
  href,
  onClick,
  as = "div",
}: CellProps) {
  const interactive = Boolean(href || onClick);
  const classes = cn(
    "relative border-b border-r border-line p-7",
    square && "sm:aspect-square",
    interactive &&
      "block w-full text-left transition-colors duration-200 hover:bg-brand-soft/40",
    className,
  );

  const marker = (
    <span
      aria-hidden
      className="absolute bottom-[-2.5px] right-[-2.5px] size-[5px] rounded-full bg-ink-4"
    />
  );

  const body = (
    <>
      {children}
      {marker}
    </>
  );

  if (href) return <a href={href} className={classes}>{body}</a>;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    );

  return As(as, classes, body);
}

function As(tag: "div" | "li", className: string, body: ReactNode) {
  return tag === "li" ? (
    <li className={className}>{body}</li>
  ) : (
    <div className={className}>{body}</div>
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
        "absolute top-11 z-50 rounded-[18px] border border-line bg-canvas p-1.5 shadow-pop",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A row inside a Popover: what it is, and one line on what it does. */
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
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">
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
