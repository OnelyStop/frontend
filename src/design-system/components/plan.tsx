import type { ReactNode } from "react";
import { cn } from "../lib/cn";

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
        <span
          key={p.id}
          className={cn(
            "-ml-3 grid size-11 place-items-center rounded-full border-3 text-[19px] first:ml-0",
            ring === "active" ? "border-active-soft" : "border-canvas",
          )}
          style={{ background: p.tint ?? "var(--color-panel)" }}
        >
          {p.mark}
        </span>
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

/** The one card in progress. At most one per screen, or it stops meaning anything. */
export function ActiveCard({
  title,
  children,
  status,
  people,
  onResume,
  resumeLabel,
  className,
}: {
  title: string;
  children?: ReactNode;
  status?: ReactNode;
  people?: { id: string; mark: ReactNode; tint?: string }[];
  onResume?: () => void;
  resumeLabel: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "bg-active-soft rounded-card shadow-lift relative mb-5 p-7 pr-36",
        className,
      )}
    >
      {/* outline rather than a box-shadow ring: outline-offset leaves the card's own tint showing in the gap. */}
      <button
        type="button"
        aria-label={resumeLabel}
        onClick={onResume}
        className="press absolute top-1/2 right-8 grid size-20 -translate-y-1/2 place-items-center rounded-full bg-white outline-2 outline-offset-8 outline-white/70"
      >
        <svg viewBox="0 0 24 24" className="ml-1 size-8 fill-current">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <h3 className="max-w-[15ch] text-[28px] leading-[1.12] font-semibold tracking-[-0.03em]">
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

/** The search field at the head of a column. */
export function SearchField({
  placeholder,
  onClick,
  hint,
}: {
  placeholder: string;
  onClick?: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press bg-panel text-ink-3 hover:text-ink-2 mb-6 flex w-full items-center gap-3 rounded-full px-5 py-3.5 text-left text-[14px]"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="flex-1">{placeholder}</span>
      {hint ? <span className="text-[12.5px]">{hint}</span> : null}
    </button>
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
  onClick,
  children,
}: {
  label: string;
  /** A canvas tint, or omit for the dark add button. */
  tint?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "press grid size-11 place-items-center rounded-full text-[17px] font-bold",
        tint ? "text-ink" : "bg-frame-2 text-white",
      )}
      style={tint ? { background: tint } : undefined}
    >
      {children}
    </button>
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
function tiltOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 5) - 2) * 0.7;
}

export function NoteCard({
  id,
  tint = "yellow",
  source,
  quote,
  when,
  action,
  children,
  className,
}: {
  id: string;
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
        "shadow-card hover:shadow-lift relative h-full rounded-[14px] p-5 transition-shadow",
        NOTE_PAPER[tint],
        className,
      )}
    >
      {action}
      {source ? <p className="text-[12px] text-black/45">{source}</p> : null}
      {quote ? (
        <p className="mt-2.5 line-clamp-2 border-l-2 border-black/20 pl-2.5 text-[12.5px] leading-relaxed text-black/55">
          {quote}
        </p>
      ) : null}
      <p className="mt-2.5 line-clamp-5 text-[13.5px] leading-relaxed text-black/80">
        {children}
      </p>
      {when ? <p className="mt-3 text-[11.5px] text-black/40">{when}</p> : null}
    </article>
  );
}
