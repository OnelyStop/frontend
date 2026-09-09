import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <h1 className="max-w-[18ch] text-[29px] leading-[1.14] font-bold tracking-[-0.03em]">
        {title}
      </h1>
      {sub || actions ? (
        <div className="lg:pt-2">
          {sub ? (
            <p className="text-ink-2 max-w-[52ch] text-[14px] leading-[1.6]">
              {sub}
            </p>
          ) : null}
          {actions ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export function SectionTitle({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex items-baseline justify-between gap-4",
        className,
      )}
    >
      <h2 className="text-ink text-[16px] font-medium tracking-[-0.01em]">
        {children}
      </h2>
      {aside ? <span className="text-ink-3 text-[13px]">{aside}</span> : null}
    </div>
  );
}

const EMPTY_TONE = {
  info: "bg-info-soft",
  brand: "bg-brand-soft",
  ok: "bg-ok-soft",
  warn: "bg-warn-soft",
} as const;

// Sized to its content: a box drawn round a 500px void only advertises the void.
export function Empty({
  title,
  sub,
  action,
  mark = "◕",
  tone = "info",
}: {
  title: string;
  sub: string;
  action?: ReactNode;
  /** A glyph, not an icon — it sits in the tinted disc above the title. */
  mark?: ReactNode;
  tone?: keyof typeof EMPTY_TONE;
}) {
  return (
    <div className="grid justify-items-center gap-3 px-6 py-11 text-center">
      <span
        aria-hidden
        className={cn(
          "mb-2 grid size-14 place-items-center rounded-full text-[22px]",
          EMPTY_TONE[tone],
        )}
      >
        {mark}
      </span>
      <p className="text-[19px] font-bold tracking-[-0.02em]">{title}</p>
      <p className="text-ink-2 max-w-[46ch] text-[13.5px] leading-relaxed">
        {sub}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line border-0 border-t", className)} />;
}
