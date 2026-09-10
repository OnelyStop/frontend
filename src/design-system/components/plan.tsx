import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../lib/cn";
import { Avatar } from "./data";

// The card family the canvas is built from, and the controls that sit on them.
export type PillTone =
  "neutral" | "ok" | "warn" | "bad" | "info" | "brand" | "soon" | "live";

const PILL: Record<PillTone, string> = {
  neutral: "bg-panel text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  brand: "bg-brand-soft text-brand",
  soon: "bg-canvas text-ink-2 shadow-[inset_0_0_0_1.5px_var(--color-line-2)]",
  live: "bg-canvas text-ink shadow-card",
};

/** State, not an action — a pill says where a thing stands. */
export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-pill inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap",
        PILL[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The round buttons in a card's action row: dismiss, more, confirm. */
export function RoundAction({
  label,
  tone = "quiet",
  onClick,
  children,
}: {
  label: string;
  tone?: "quiet" | "dark" | "leaf";
  onClick?: () => void;
  children: ReactNode;
}) {
  const TONE = {
    quiet: "bg-panel text-ink-2 hover:bg-line-2 hover:text-ink",
    dark: "bg-frame text-white hover:bg-frame-2",
    leaf: "bg-ok-soft text-ok hover:brightness-95",
  } as const;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "press grid size-11 shrink-0 place-items-center rounded-full",
        TONE[tone],
      )}
    >
      {children}
    </button>
  );
}

/** The disc in a card's top-right corner: locked, or the subject's mark. */
export function CornerBadge({
  tone = "quiet",
  children,
}: {
  tone?: "quiet" | "leaf" | "info";
  children: ReactNode;
}) {
  const TONE = {
    quiet: "bg-panel text-ink-3",
    leaf: "bg-ok-soft text-ok",
    info: "bg-info-soft text-info",
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-4 right-4 grid size-10 place-items-center rounded-full",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/** The affordance that hangs off a card's corner rather than sitting inside it. */
export function CornerPlus({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="press bg-ok-soft text-ok shadow-card absolute -top-4 -right-4 z-4 grid size-12 place-items-center rounded-full"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M12 6v12M6 12h12" />
      </svg>
    </button>
  );
}

/** Who else is on this — overlapped, ringed in the card's own ground. */
export function AvatarStack({
  people,
  ring = "canvas",
}: {
  people: { id: string; mark: ReactNode; tint?: string }[];
  ring?: "canvas" | "active";
}) {
  return (
    <div className="flex">
      {people.map((p) => (
        <Avatar
          key={p.id}
          tint={p.tint}
          size={44}
          className={cn(
            "-ml-3 border-3 first:ml-0",
            ring === "active" ? "border-active-soft" : "border-canvas",
          )}
        >
          {p.mark}
        </Avatar>
      ))}
    </div>
  );
}

/** A card in the plan: what it is, where it stands, what you can do to it. */
export function PlanCard({
  title,
  children,
  meta,
  status,
  actions,
  corner,
  plus,
  size = "lg",
  className,
}: {
  title: string;
  children?: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  corner?: ReactNode;
  plus?: ReactNode;
  /** `sm` is for a grid of many; the display title only reads at `lg`, one or two to a row. */
  size?: "sm" | "lg";
  className?: string;
}) {
  const lg = size === "lg";

  return (
    <article
      className={cn(
        "card card-lift relative mb-5",
        lg ? "p-7" : "p-5",
        className,
      )}
    >
      {plus}
      {corner}
      <h3
        className={cn(
          "font-semibold tracking-[-0.03em]",
          lg
            ? "max-w-[16ch] text-[28px] leading-[1.12]"
            : "max-w-[26ch] text-[17px] leading-tight",
        )}
      >
        {title}
      </h3>
      {children ? (
        <p
          className={cn(
            "text-ink-2 max-w-[36ch]",
            lg
              ? "mt-3 text-[15px] leading-normal"
              : "mt-2 text-[13.5px] leading-[1.55]",
          )}
        >
          {children}
        </p>
      ) : null}
      {meta ? (
        <div className="text-ink-2 mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px]">
          {meta}
        </div>
      ) : null}
      {status || actions ? (
        <div className={cn("flex items-center gap-2.5", lg ? "mt-6" : "mt-4")}>
          {status}
          <span className="flex-1" />
          {actions}
        </div>
      ) : null}
    </article>
  );
}

/** The way into a section: a tinted card whose count sits on the floor, whatever the blurb runs to. */
export function IndexCard({
  title,
  children,
  badge,
  footer,
  className,
}: {
  title: string;
  children?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "card card-lift relative flex h-full flex-col p-6",
        className,
      )}
    >
      {badge}
      <h3 className="max-w-[14ch] text-[20px] leading-[1.16] font-bold tracking-[-0.03em]">
        {title}
      </h3>
      {children ? (
        <p className="text-ink-2 mt-3 max-w-[34ch] text-[14.5px] leading-[1.58]">
          {children}
        </p>
      ) : null}
      {footer ? <div className="mt-auto pt-6">{footer}</div> : null}
    </article>
  );
}

/** The one card in progress. At most one per screen, or it stops meaning anything. */
export function ActiveCard({
  title,
  kicker,
  children,
  status,
  people,
  onResume,
  resumeLabel,
  tilt,
  className,
}: {
  title: string;
  /** The line above the title — what kind of thing is in progress. */
  kicker?: string;
  children?: ReactNode;
  status?: ReactNode;
  people?: { id: string; mark: ReactNode; tint?: string }[];
  onResume?: () => void;
  resumeLabel: string;
  /** A degree or two off square is what makes it read as the one card picked up off the pile. */
  tilt?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "bg-active-soft rounded-card shadow-lift relative mb-5 min-w-0 p-6 pr-28 sm:p-7 sm:pr-36",
        tilt && "-rotate-[1.5deg]",
        className,
      )}
    >
      {kicker ? (
        <p className="mb-2 text-[12.5px] font-semibold text-black/50">
          {kicker}
        </p>
      ) : null}
      {/* outline rather than a box-shadow ring: outline-offset leaves the card's own tint showing in the gap. */}
      <button
        type="button"
        aria-label={resumeLabel}
        onClick={onResume}
        className="press absolute top-1/2 right-5 grid size-16 -translate-y-1/2 place-items-center rounded-full bg-white outline-2 outline-offset-6 outline-white/70 sm:right-8 sm:size-20 sm:outline-offset-8"
      >
        <svg viewBox="0 0 24 24" className="ml-1 size-8 fill-current">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <h3 className="max-w-[15ch] text-[24px] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[28px]">
        {title}
      </h3>
      {children ? (
        <p className="mt-3 max-w-[32ch] text-[15px] leading-normal text-black/55">
          {children}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-3">
        {status}
        {people?.length ? (
          <span className="ml-auto">
            <AvatarStack people={people} ring="active" />
          </span>
        ) : null}
      </div>
    </article>
  );
}

/** The floating toolbar. Each button is a tinted disc on the frame. */
export function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="bg-frame shadow-pop sticky bottom-6 z-8 mx-auto flex w-fit items-center gap-2.5 rounded-full p-3">
      {children}
    </div>
  );
}

export function DockButton({
  label,
  tint,
  href,
  current,
  onClick,
  children,
}: {
  label: string;
  /** A canvas tint, or omit for the dark add button. */
  tint?: string;
  href?: string;
  /** The page you are on: white on the frame, so the dock doubles as a where-am-I. */
  current?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const classes = cn(
    "press grid size-11 place-items-center rounded-full text-[17px] font-bold",
    current
      ? "bg-white text-frame"
      : tint
        ? "text-ink"
        : "bg-frame-2 text-white",
  );
  const style = tint && !current ? { background: tint } : undefined;

  return href ? (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={classes}
      style={style}
    >
      {children}
    </Link>
  ) : (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={classes}
      style={style}
    >
      {children}
    </button>
  );
}

/** A sequence: a dashed rule down the left with a dot beside each child. */
export function Spine({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid grid-cols-[minmax(0,1fr)] gap-4 pl-6",
        className,
      )}
    >
      <span
        aria-hidden
        className="border-ok-2 absolute top-6 bottom-6 left-1.75 border-l-2 border-dashed"
      />
      {children}
    </div>
  );
}

export function SpineItem({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-w-0">
      <span
        aria-hidden
        className="bg-ok-2 border-stage absolute top-1/2 -left-6 z-1 size-2.5 -translate-y-1/2 rounded-full border-2"
      />
      {children}
    </div>
  );
}

export type NoteTint = "yellow" | "blue" | "green" | "pink";

// The paper a note is written on, not a card with a note inside it.
const NOTE_PAPER: Record<NoteTint, string> = {
  yellow: "bg-[#fdf3c8]",
  blue: "bg-[#d9ecfb]",
  green: "bg-[#d6f2dd]",
  pink: "bg-[#fbdcec]",
};

/** Tilt is derived from the id so a note never shifts between renders. */
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function tiltOf(id: string): number {
  return ((hashOf(id) % 5) - 2) * 0.7;
}

const TINTS: NoteTint[] = ["yellow", "blue", "green", "pink"];

// Without a colour every note would be yellow, and a wall of notes reads as one block.
function tintOf(id: string): NoteTint {
  return TINTS[hashOf(id) % TINTS.length];
}

export function NoteCard({
  id,
  tint,
  source,
  quote,
  when,
  action,
  children,
  className,
}: {
  id: string;
  /** Omit and it is derived from the id, so a page of notes is never one colour. */
  tint?: NoteTint;
  source?: ReactNode;
  /** The passage the note was written against. */
  quote?: string | null;
  when?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      style={{ rotate: `${tiltOf(id)}deg` }}
      className={cn(
        // pt-8 is one whole rule: any other top padding offsets the text from the lines and they strike through it.
        "ruled shadow-card hover:shadow-lift relative h-full rounded-[14px] px-5 pt-8 pb-6 transition-shadow",
        NOTE_PAPER[tint ?? tintOf(id)],
        className,
      )}
    >
      {action}
      {source ? <p className="text-[12px] text-black/45">{source}</p> : null}
      {quote ? (
        <p className="line-clamp-2 border-l-2 border-black/20 pl-2.5 text-[12.5px] text-black/55">
          {quote}
        </p>
      ) : null}
      <p className="line-clamp-5 text-[13.5px] text-black/80">{children}</p>
      {when ? <p className="text-[11.5px] text-black/40">{when}</p> : null}
    </article>
  );
}
