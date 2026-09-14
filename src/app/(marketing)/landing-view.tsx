import { cn } from "@/design-system";
import { PLAN_LIMITS } from "@/features/billing/limits";
import type { PlanPrice } from "@/features/billing/types";
import { PlanGrid } from "@/features/pricing/components/PlanGrid";
import { FAQ } from "./faq";
import { Cta } from "./_sections/cta";
import { Hero } from "./_sections/hero";
import { MarkingScene } from "./_sections/marking";
import { Mosaic } from "./_sections/mosaic";
import { Promises } from "./_sections/promises";
import { SteadyList } from "./_sections/steady-list";
import { Strategy } from "./_sections/strategy";
import { EYEBROW, H2, PANEL, Wash } from "./_sections/surface";

export function LandingView({
  prices,
  billingEnabled,
}: {
  prices: PlanPrice[];
  billingEnabled: boolean;
}) {
  return (
    // isolate: the grain sits at -z-10, above this cream but under every section.
    <main className="relative isolate flex-1 bg-[#f7f4ee]">
      <div
        aria-hidden
        className="script-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.16]"
      />

      <Hero />

      <Mosaic />

      <MarkingScene />

      <Promises />

      <Strategy />

      <Wash tone="#f8efd6" id="pricing">
        <div className="mx-auto max-w-300 text-center">
          <p className={cn(EYEBROW, "text-[#7a5a12]/75")}>Pricing</p>
          <h2 className={cn(H2, "mx-auto mt-5 max-w-[18ch]")}>
            The free plan is not a trial
          </h2>
          <p className="mx-auto mt-6 max-w-[64ch] text-[16px] leading-relaxed text-[#5a4a2a] lg:text-[17px]">
            Free covers the knowledge base, your private notes, a week of
            current affairs, {PLAN_LIMITS.free.mocksPerMonth} full mocks a
            month, {PLAN_LIMITS.free.drillsPerDay} drills a day,{" "}
            {PLAN_LIMITS.free.descriptiveMarkingsPerMonth} descriptive markings
            a month and {PLAN_LIMITS.free.askOnelyPerMonth} Ask Onely questions
            a month. No card, no expiry. Pro raises those caps rather than
            introducing them: unlimited mocks and drills, the full
            current-affairs archive, the attempt map,{" "}
            {PLAN_LIMITS.pro.descriptiveMarkingsPerMonth} markings and{" "}
            {PLAN_LIMITS.pro.askOnelyPerMonth} Ask Onely questions a month. Pro+
            is for the descriptive papers, where the marking is the point:{" "}
            {PLAN_LIMITS.pro_plus.descriptiveMarkingsPerMonth} markings a month.
          </p>
          <PlanGrid
            variant="public"
            headingLevel={3}
            prices={prices}
            billingEnabled={billingEnabled}
          />
        </div>
      </Wash>

      <Wash tone="#f6e6ea" id="faq">
        <div className="mx-auto grid max-w-300 items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-[clamp(32px,6vw,88px)]">
          <header className="lg:sticky lg:top-28">
            <p className={cn(EYEBROW, "text-[#8b3b5d]/75")}>FAQ</p>
            <h2 className={cn(H2, "mt-5 max-w-[14ch]")}>
              Questions people ask before signing up
            </h2>
          </header>

          <SteadyList className="grid content-start gap-3">
            {FAQ.map((item) => (
              <details
                key={item.question}
                name="faq"
                className={cn(PANEL, "group p-5 sm:px-6")}
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[16px] font-medium tracking-[-0.01em] md:text-[17px] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden
                    className="group-open:bg-ink ease-soft ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-[#f6e6ea] text-[16px] leading-none text-[#8b3b5d] transition-colors duration-200 group-open:text-white"
                  >
                    <span className="ease-soft block transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="text-ink-2 mt-4 max-w-[70ch] text-[15px] leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </SteadyList>
        </div>
      </Wash>

      <Cta />
    </main>
  );
}
