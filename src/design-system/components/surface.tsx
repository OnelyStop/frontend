import type { ReactNode } from "react";
import { cn } from "../lib/cn";

// Panels are hairline on white, no shadow. Only things that float (menus,
// palettes) lift.

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
    <section className={cn("card", pad && "p-8", className)}>
      {children}
    </section>
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

// The container draws the top and left edge; each cell draws its own bottom
// and right, so any column count works without per-breakpoint rules.

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
    <As
      className={cn(
        "border-line grid border-t border-l",
        COLS[cols],
        className,
      )}
    >
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
      className="bg-ink-4 absolute right-[-2.5px] bottom-[-2.5px] size-[5px] rounded-full"
    />
  );

  const body = (
    <>
      {children}
      {marker}
    </>
  );

  if (href)
    return (
      <a href={href} className={classes}>
        {body}
      </a>
    );
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
