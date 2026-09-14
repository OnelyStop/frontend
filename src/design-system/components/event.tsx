import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { cn } from "../lib/cn";

export type EventTone =
  | "info"
  | "brand"
  | "warn"
  | "ok"
  | "bad"
  | "quant"
  | "reasoning"
  | "english"
  | "ga"
  | "computer";

const TONE: Record<EventTone, [card: string, panel: string]> = {
  info: ["bg-info-soft", "bg-info-pale"],
  brand: ["bg-brand-soft", "bg-brand-pale"],
  warn: ["bg-warn-soft", "bg-warn-pale"],
  ok: ["bg-ok-soft", "bg-ok-pale"],
  bad: ["bg-bad-soft", "bg-bad-pale"],
  quant: ["bg-quant-soft", "bg-quant-pale"],
  reasoning: ["bg-reasoning-soft", "bg-reasoning-pale"],
  english: ["bg-english-soft", "bg-english-pale"],
  ga: ["bg-ga-soft", "bg-ga-pale"],
  computer: ["bg-computer-soft", "bg-computer-pale"],
};

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
        "shadow-card flex h-full w-full flex-col rounded-4xl p-2.5",
        card,
        className,
      )}
    >
      <div className="mb-6 flex items-start gap-2.5 px-3.5 pt-2">
        {mark}
        <span className="min-w-0 flex-1 text-[15px] leading-snug font-bold">
          {kind}
        </span>
        {/* Never wraps: a two-line meta is what makes a row of cards look uneven. */}
        <span className="shrink-0 text-[13px] font-semibold whitespace-nowrap opacity-70">
          {when}
        </span>
      </div>
      <div
        className={cn(
          "flex-1 rounded-xl px-3.5 py-5 text-[13.5px] leading-[1.55] text-black/65",
          panel,
        )}
      >
        {children}
      </div>
      {footer ? <div className="mt-2.5">{footer}</div> : null}
    </article>
  );
}

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
        "border-line-2 text-ink-3 grid h-32 w-full place-items-center rounded-xl border-2 border-dashed px-10 text-[13.5px]",
        className,
      )}
    >
      {label}
    </div>
  );
}
