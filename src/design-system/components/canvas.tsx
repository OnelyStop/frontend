import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { cn } from "../lib/cn";

// Up to three columns of cards on the stage; the frame and rail live in AppLayout.

export function Canvas({
  children,
  mid,
  aside,
  className,
}: {
  children: ReactNode;
  /** Middle column — search, figures, secondary cards. */
  mid?: ReactNode;
  /** Right column — what happens next. */
  aside?: ReactNode;
  className?: string;
}) {
  // Columns collapse rather than shrink: a card below ~380px stops being readable.
  const cols = aside
    ? mid
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_384px]"
      : "lg:grid-cols-[minmax(0,1fr)_384px]"
    : mid
      ? "lg:grid-cols-2"
      : "";

  return (
    <div className={cn("grid gap-x-10 gap-y-8", cols, className)}>
      <div className="min-w-0">{children}</div>
      {mid ? <div className="min-w-0">{mid}</div> : null}
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </div>
  );
}

export function CanvasTitle({
  children,
  note,
  className,
}: {
  children: ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-7", className)}>
      <h1 className="text-[29px] leading-[1.14] font-bold tracking-[-0.03em]">
        {children}
      </h1>
      {note ? (
        <p className="text-ink-2 mt-2 max-w-[54ch] text-[14px] leading-[1.6]">
          {note}
        </p>
      ) : null}
    </header>
  );
}

/** A tinted card in the right column: what is scheduled, and when. */
export function EventCard({
  kind,
  when,
  icon,
  tone = "info",
  children,
  at,
  footer,
  className,
}: {
  kind: string;
  when: string;
  icon?: ReactNode;
  tone?: "info" | "brand" | "warn" | "ok";
  children: ReactNode;
  /** The start time, as its own white row — the one thing you act on. */
  at?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const TONE = {
    info: ["bg-info-pale", "bg-info-soft"],
    brand: ["bg-brand-pale", "bg-brand-soft"],
    warn: ["bg-warn-pale", "bg-warn-soft"],
    ok: ["bg-ok-pale", "bg-ok-soft"],
  } as const;

  const [card, panel] = TONE[tone];

  return (
    <article
      className={cn("shadow-card mb-3 rounded-xl p-2.5", card, className)}
    >
      <div className="mb-2.5 flex items-center gap-2.5 px-3.5 pt-2">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="text-[15px] font-bold">{kind}</span>
        <span className="ml-auto text-[13px] font-semibold opacity-70">
          {when}
        </span>
      </div>
      <div
        className={cn(
          "rounded-ctl p-3.5 text-[13.5px] leading-[1.55] text-black/65",
          panel,
        )}
      >
        {children}
      </div>
      {at ? (
        <div className="bg-canvas rounded-ctl mt-2.5 flex items-center justify-center gap-2 py-2.5 text-[13.5px] font-semibold">
          <Clock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {at}
        </div>
      ) : null}
      {footer ? <div className="mt-2.5">{footer}</div> : null}
    </article>
  );
}

/** The dashed slot a card is dragged into — an empty schedule, not an error. */
export function DropSlot({ label }: { label: string }) {
  return (
    <div className="border-line-2 text-ink-3 grid h-32 place-items-center rounded-xl border-2 border-dashed text-[13.5px]">
      {label}
    </div>
  );
}
