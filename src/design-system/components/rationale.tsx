import type { ReactNode } from "react";
import { cn } from "../lib/cn";

// A generated mark that renders identically to a human one is the trust problem.
export function Rationale({
  title = "Onely",
  children,
  quota,
  onReport,
  actions,
  className,
}: {
  title?: string;
  children: ReactNode;
  /** e.g. "247 of 250 left" — omit only where no quota is metered. */
  quota?: string;
  onReport?: () => void;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "bg-brand-soft shadow-card rounded-xl p-6 sm:p-7",
        className,
      )}
    >
      <h3 className="text-brand flex items-center gap-2.5 text-[15px] font-bold">
        <SparkFree />
        {title}
      </h3>

      <div className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-[#46394f]">
        {children}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {actions}
        {onReport ? (
          <button
            type="button"
            onClick={onReport}
            className="press rounded-pill text-brand bg-white/70 px-4 py-2.5 text-[13.5px] font-semibold hover:bg-white"
          >
            This looks wrong
          </button>
        ) : null}
        {quota ? (
          <span className="tnum text-brand ml-auto text-[13px] opacity-80">
            {quota}
          </span>
        ) : null}
      </div>
    </section>
  );
}

// An open arc rather than the four-point sparkle every AI panel ships with.
function SparkFree() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M20 12a8 8 0 1 1-3.2-6.4" />
      <path d="M4 20l1.6-4" />
    </svg>
  );
}
