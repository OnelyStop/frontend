import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { cn } from "../lib/cn";

// The schedule family: what is booked, the mark that names it, the time it starts, and an empty slot.
export type EventTone = "info" | "brand" | "warn" | "ok";

const TONE: Record<EventTone, [card: string, panel: string]> = {
  info: ["bg-info-soft", "bg-info-pale"],
  brand: ["bg-brand-soft", "bg-brand-pale"],
  warn: ["bg-warn-soft", "bg-warn-pale"],
  ok: ["bg-ok-soft", "bg-ok-pale"],
};

/** The mark before an event's name. `disc` is for a person or a place; a kind of work goes bare. */
export function EventMark({
  children,
  disc,
  className,
}: {
  children: ReactNode;
  disc?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center [&>svg]:size-4",
        disc && "bg-canvas size-7 rounded-full",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The white row an event is acted on from — when it starts. */
export function EventTime({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-canvas rounded-ctl flex items-center justify-center gap-2 py-2.5 text-[13.5px] font-semibold",
        className,
      )}
    >
      <Clock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </div>
  );
}

/** What is scheduled, and when — a pale card holding a tinted panel. */
export function EventCard({
  kind,
  when,
  mark,
  tone = "info",
  children,
  footer,
  className,
}: {
  kind: string;
  when: string;
  mark?: ReactNode;
  tone?: EventTone;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const [card, panel] = TONE[tone];

  return (
    <article
      className={cn(
        "shadow-card h-fit w-fit max-w-full rounded-4xl p-2.5",
        card,
        className,
      )}
    >
      <div className="mb-6 flex items-center gap-2.5 px-3.5 pt-2">
        {mark}
        <span className="text-[15px] font-bold">{kind}</span>
        <span className="ml-auto text-[13px] font-semibold opacity-70">
          {when}
        </span>
      </div>
      <div
        className={cn(
          "rounded-xl py-5 pr-8 pl-3.5 text-[13.5px] leading-[1.55] text-black/65 sm:pr-26",
          panel,
        )}
      >
        {/* The text width, in characters. max-w-full is what keeps it inside the panel when the column is narrow. */}
        <p className="w-[30ch] max-w-full">{children}</p>
      </div>
      {footer ? <div className="mt-2.5">{footer}</div> : null}
    </article>
  );
}

/** The dashed slot a card is dragged into — an empty schedule, not an error. */
export function DropSlot({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line-2 text-ink-3 grid h-32 w-fit place-items-center rounded-xl border-2 border-dashed px-10 text-[13.5px]",
        className,
      )}
    >
      {label}
    </div>
  );
}
