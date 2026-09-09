import type { ReactNode } from "react";
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
