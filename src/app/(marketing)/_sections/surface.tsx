import { cn } from "@/design-system";

export const EYEBROW = "text-[13px] font-semibold tracking-[0.08em] uppercase";

export const H2 =
  "text-ink text-[clamp(32px,3.6vw,48px)] leading-[1.08] font-medium tracking-[-0.03em] text-balance";

export const PANEL =
  "rounded-[24px] bg-white/90 shadow-[0_1px_2px_rgb(30_30_40/0.05),0_10px_30px_rgb(30_30_40/0.07)]";

export const GRAIN =
  "script-grain pointer-events-none absolute inset-0 mix-blend-soft-light";

// A tinted, grained card on the page, the shape the hero, promises and CTA share.
export function Shell({
  tone,
  id,
  className,
  children,
}: {
  tone: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-2 py-[clamp(12px,2vw,28px)] sm:px-3">
      <div
        className={cn(
          "relative mx-auto max-w-340 overflow-hidden rounded-[28px] sm:rounded-[36px]",
          tone,
          className,
        )}
      >
        <div aria-hidden className={cn(GRAIN, "opacity-[0.25]")} />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}

// An open section on a tint that fades in and out, so neighbours meet without a hard edge.
export function Wash({
  tone,
  id,
  className,
  children,
}: {
  tone: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-5 py-[clamp(64px,7vw,104px)] sm:px-8 lg:px-16",
        className,
      )}
      style={{
        background: `linear-gradient(180deg, transparent, ${tone} 18%, ${tone} 82%, transparent)`,
      }}
    >
      {children}
    </section>
  );
}
