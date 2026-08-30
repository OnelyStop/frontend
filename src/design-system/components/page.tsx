import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/* Page furniture.

   Every screen opens the same way: a large light headline on the left, the
   paragraph and any controls on the right. Panel labels are sentence case at
   body size — nothing in this app shouts in tracked-out capitals. */

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
    <header className="mb-12 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <h1 className="max-w-[16ch] text-[48px] leading-[1.05] tracking-[-0.03em]">
        {title}
      </h1>
      {sub || actions ? (
        <div className="lg:pt-1.5">
          {sub ? (
            <p className="max-w-[46ch] text-[16px] leading-[1.55] text-ink-2">
              {sub}
            </p>
          ) : null}
          {actions ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div>
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
    <div className={cn("mb-6 flex items-baseline justify-between gap-4", className)}>
      <h2 className="text-[16px] font-medium tracking-[-0.01em] text-ink">
        {children}
      </h2>
      {aside ? <span className="text-[13px] text-ink-3">{aside}</span> : null}
    </div>
  );
}

export function Empty({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-24 text-center">
      <p className="text-[18px]">{title}</p>
      <p className="max-w-[44ch] text-[15px] leading-relaxed text-ink-3">{sub}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
