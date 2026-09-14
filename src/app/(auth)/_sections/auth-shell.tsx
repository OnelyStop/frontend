import type { ReactNode } from "react";
import { Brand, cn } from "@/design-system";
import { Clouds } from "@/app/(marketing)/_sections/clouds";
import { Collage } from "@/app/(marketing)/_sections/collage";
import { PhoneWindow } from "@/app/(marketing)/_sections/phone-window";
import { EYEBROW, GRAIN, PANEL } from "@/app/(marketing)/_sections/surface";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode | null;
  /** Sits on the card's top edge, above the title. */
  mascot?: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  mascot,
}: Props) {
  return (
    <div className="relative isolate grid min-h-dvh bg-[#f7f4ee] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div
        aria-hidden
        className="script-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.16]"
      />

      <div className="flex flex-col px-5 pt-7 pb-8 sm:px-10 lg:px-16">
        <Brand href="/" className="self-start" />

        <div className="mx-auto flex w-full max-w-105 flex-1 flex-col justify-center py-10">
          <div
            className={cn(
              PANEL,
              "relative bg-white px-6 pt-8 pb-7 sm:px-9",
              mascot && "mt-20",
            )}
          >
            {mascot ? (
              <div className="pointer-events-none absolute bottom-[calc(100%-22px)] left-1/2 w-40 -translate-x-1/2">
                {mascot}
              </div>
            ) : null}

            <h1 className="text-center text-[26px] font-medium tracking-[-0.03em]">
              {title}
            </h1>
            <p className="text-ink-2 mt-1.5 text-center text-[14.5px]">
              {subtitle}
            </p>
            {children}
          </div>

          {footer ? (
            <div className="text-ink-2 mt-6 text-center text-[14px]">
              {footer}
            </div>
          ) : null}
        </div>
      </div>

      {/* The landing hero in miniature, so signing in feels like the same place you came from. */}
      <aside
        aria-hidden
        className="sticky top-0 hidden h-dvh p-3 select-none lg:block"
      >
        <div className="relative h-full overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#a5b1f2_0%,#c4bff3_40%,#e7d3f1_74%,#f8dccd_100%)]">
          <Clouds />
          <div className={cn(GRAIN, "opacity-[0.22]")} />

          <div className="relative px-10 pt-14 xl:px-14">
            <p className={cn(EYEBROW, "text-[#3a3470]/70")}>onelystop</p>
            <p className="text-ink mt-4 max-w-[16ch] text-[clamp(30px,2.6vw,44px)] leading-[1.08] font-medium tracking-[-0.03em]">
              The total is not the exam.{" "}
              <span className="text-[#4a4470]/70">
                Every section has its own cutoff.
              </span>
            </p>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-[58%]">
            <Collage variant="wide" className="absolute inset-0 size-full" />
            <PhoneWindow className="absolute top-[18%] left-1/2 w-[min(300px,62%)] -translate-x-1/2" />
          </div>
        </div>
      </aside>
    </div>
  );
}
