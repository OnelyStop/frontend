import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/design-system";
import { SUPPORT_EMAIL } from "@/config/site";
import { EXAMS } from "@/data/navigation";
import { PLAN_LIMITS } from "@/features/billing/limits";
import type { PlanPrice } from "@/features/billing/types";
import { PlanGrid } from "@/features/pricing/components/PlanGrid";
import { FAQ } from "./faq";
import { AppWindow } from "./_sections/app-window";
import { Cta } from "./_sections/cta";
import { MarkingScene } from "./_sections/marking";
import { Mosaic } from "./_sections/mosaic";
import { PhoneWindow } from "./_sections/phone-window";

// The date is the point: a pledge that can be quietly edited is not one.
const PLEDGE_DATED = "5 September 2026";

const GUTTER = "px-5 sm:px-8 lg:px-16";
const SECTION_Y = "py-[clamp(64px,7vw,104px)]";

// Soft white cores with colour only bleeding through underneath, not solid colour blobs — reads as cloud, not gradient.
const HERO_GLOW: React.CSSProperties = {
  inset: "-20% -10% -25%",
  filter: "blur(64px)",
  mixBlendMode: "screen",
  background: [
    "radial-gradient(30% 42% at 22% 22%, rgb(255 255 255 / 0.4) 0%, transparent 72%)",
    "radial-gradient(34% 46% at 58% 8%, rgb(255 255 255 / 0.32) 0%, transparent 74%)",
    "radial-gradient(30% 40% at 86% 28%, rgb(255 255 255 / 0.26) 0%, transparent 72%)",
    "radial-gradient(40% 58% at 15% 20%, #4c6fff 0%, transparent 68%)",
    "radial-gradient(38% 54% at 55% 6%, #8a5cf5 0%, transparent 70%)",
    "radial-gradient(40% 58% at 88% 26%, #33cba3 0%, transparent 68%)",
  ].join(","),
};

const PLEDGE = [
  {
    no: "01",
    claim: "Two full mocks a month are free, forever.",
    rest: "No trial, no card, no countdown.",
  },
  {
    no: "02",
    claim: "The descriptive marking is a model reading a rubric.",
    rest: "It is fast and it is specific, and it is not an examiner.",
  },
  {
    no: "03",
    claim: "You can see why it gave every mark.",
    rest: "Four weighted bands, each scored and commented on, with fixes that quote your own sentences back.",
  },
  {
    no: "04",
    claim: "We launched this month, so there are no reviews yet.",
    rest: "When there are, they'll be real ones with names on them.",
  },
  {
    no: "05",
    claim: "Your answers are yours.",
    rest: "They are not used to train anything, and closing your account deletes them.",
  },
  {
    no: "06",
    claim: `If a mark looks wrong, email ${SUPPORT_EMAIL} and a person reads it.`,
    rest: "There is no report button in the app yet, so email is the route. That's how the marking gets better.",
  },
  {
    no: "07",
    claim: "Negative marking is never hidden.",
    rest: "Every score shows what wrong answers took back, a quarter mark at a time.",
  },
];

const STRATEGY_ROWS = [
  {
    label: "Every wrong answer costs a quarter mark.",
    body: "IBPS and SBI deduct 0.25 for each wrong answer. The attempt map prices that into every question before you commit to it.",
  },
  {
    label: "Accuracy against pace, per topic.",
    body: "Bank what you get right quickly. Skip what you get wrong slowly. The map shows which is which, from your own sittings.",
  },
  {
    label: "Sectional timing is real timing.",
    body: "Twenty minutes for English means twenty minutes. The mock moves on without you, the way the paper does.",
  },
  {
    label: "Ten minutes is a real session.",
    body: "A drill fits a bus ride, not a study block you don't have.",
  },
];

export function LandingView({
  prices,
  billingEnabled,
}: {
  prices: PlanPrice[];
  billingEnabled: boolean;
}) {
  return (
    <main className="flex-1">
      {/* Same dark frame the signed-in app opens on — the mockup below overlaps its rounded bottom edge on purpose. */}
      <section className="bg-frame relative overflow-hidden rounded-b-[32px]">
        <div aria-hidden className="absolute inset-0" style={HERO_GLOW} />
        {/* The same grain the marking scene uses — it's what keeps the glow reading as mist, not a flat gradient. */}
        <div
          aria-hidden
          className="script-grain pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        />
        <div
          className={`${GUTTER} relative pt-[clamp(48px,7vw,88px)] pb-[clamp(150px,17vw,230px)]`}
        >
          <div className="mx-auto max-w-300">
            <ul className="flex flex-wrap gap-2">
              {EXAMS.map((exam) => (
                <li
                  key={exam}
                  className="bg-on-frame-line/70 text-on-frame-2 rounded-pill px-3 py-1.5 text-[13px]"
                >
                  {exam}
                </li>
              ))}
            </ul>

            <div className="mt-7 grid items-end gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
              <h1 className="text-on-frame text-[38px] leading-[1.06] tracking-[-0.025em] text-balance md:text-[50px] lg:text-[60px]">
                Clear every sectional cutoff
              </h1>
              <p className="text-on-frame-2 text-[18px] leading-relaxed lg:text-[19px]">
                Full mocks under real sectional timing, drills aimed at what
                costs you marks, and one grounded question per current-affairs
                story. Scored the way the paper is, negative marking included.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink
                href="/signup"
                size="lg"
                className="bg-canvas text-frame hover:bg-canvas/90"
              >
                Sit a free mock
              </ButtonLink>
              <ButtonLink
                href="#marking"
                size="lg"
                variant="secondary"
                className="border-on-frame-line text-on-frame bg-transparent hover:bg-white/5"
              >
                See a marked answer
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`${GUTTER} relative z-1 mx-auto -mt-[clamp(120px,15vw,200px)] max-w-300`}
      >
        <div className="relative">
          <AppWindow />
          {/* Off square, like ActiveCard's tilt — the phone reads as set down beside the window, not pasted on. */}
          <div className="absolute -right-6 -bottom-16 hidden rotate-3 lg:block xl:-right-10">
            <PhoneWindow />
          </div>
        </div>
      </div>

      <Mosaic />

      <MarkingScene />

      <section className={`${GUTTER} ${SECTION_Y} bg-panel/40`} id="promises">
        <div className="mx-auto max-w-300">
          <header className="flex flex-wrap items-start justify-between gap-x-16 gap-y-6 pb-12">
            <div>
              <p className="text-ink-3 text-[15px]">Our promises</p>
              <h2 className="mt-3 max-w-[16ch] text-[44px] leading-[1.06] tracking-[-0.03em]">
                Straight answers before you sign up
              </h2>
            </div>
            <p className="text-ink-2 max-w-[42ch] text-[16px] leading-[1.55]">
              Seven of them, numbered and dated. What the marking actually is,
              what it costs, what happens to your answers, and the one question
              we can&rsquo;t answer yet.
            </p>
          </header>

          {/* Same gap-as-border technique as the feature mosaic below — one seam, not two competing ones. */}
          <ol className="bg-line-2 rounded-ctl grid grid-cols-1 gap-px overflow-hidden p-px sm:grid-cols-2 lg:grid-cols-4">
            {PLEDGE.map((c) => (
              <li
                key={c.no}
                className="bg-canvas hover:bg-panel relative p-7 transition-colors duration-200 sm:aspect-square"
              >
                <span className="tnum text-ink-3 text-[13px]">{c.no}</span>
                <p className="text-ink mt-6 text-[17px] leading-snug font-medium tracking-[-0.01em]">
                  {c.claim}
                </p>
                <p className="text-ink-2 mt-2.5 text-[14px] leading-[1.55]">
                  {c.rest}
                </p>

                <span
                  aria-hidden
                  className="bg-ink-4 absolute right-4 bottom-4 size-1.25 rounded-full"
                />
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
            <span className="text-ink-3 text-[14px]">
              This version: {PLEDGE_DATED}
            </span>
            <a
              href="/terms"
              className="text-ink decoration-line-2 hover:decoration-ink inline-flex items-center gap-1.5 text-[14px] underline underline-offset-4 transition-colors"
            >
              Every change to this list is dated
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section
        className={`${GUTTER} ${SECTION_Y} bg-canvas border-line border-t`}
        id="attempt-map"
      >
        <div className="mx-auto grid max-w-300 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-[clamp(32px,6vw,88px)]">
          <header className="lg:sticky lg:top-22">
            <h2 className="text-[30px] tracking-[-0.02em] text-balance md:text-[36px] lg:text-[40px]">
              Negative marking sets the strategy
            </h2>
            <p className="text-ink-2 mt-5 text-[18px] leading-relaxed lg:text-[19px]">
              Not a generic score. The attempt map reads accuracy against pace
              from your own sittings, and prices a quarter-mark penalty into
              every question you might attempt.
            </p>
          </header>
          <div className="grid">
            {STRATEGY_ROWS.map((row, i) => (
              <details
                key={row.label}
                name="strategy"
                open={i === 0}
                className="border-line-2 group border-t last:border-b"
              >
                <summary className="text-ink-2 hover:text-ink group-open:text-ink flex cursor-pointer list-none items-baseline gap-4 py-5 text-[16px] transition-colors [&::-webkit-details-marker]:hidden">
                  <span>{row.label}</span>
                  <span
                    aria-hidden
                    className="ml-auto size-2.5 shrink-0 -translate-y-0.5 rotate-45 border-r-[1.5px] border-b-[1.5px] border-current transition-transform duration-300 group-open:translate-y-0.5 group-open:-rotate-135"
                  />
                </summary>
                <p className="text-ink-3 max-w-[54ch] pb-5 text-[14px] leading-relaxed">
                  {row.body}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${GUTTER} ${SECTION_Y}`} id="pricing">
        <div className="mx-auto max-w-300 text-center">
          <h2 className="mx-auto max-w-[18ch] text-[26px] tracking-[-0.02em] text-balance md:text-[30px]">
            The free plan is not a trial
          </h2>
          <p className="text-ink-2 mx-auto mt-5 max-w-[62ch] text-[18px] leading-relaxed lg:text-[19px]">
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
      </section>

      <section className={`${GUTTER} ${SECTION_Y} bg-panel/40`} id="faq">
        <div className="mx-auto grid max-w-300 items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-[clamp(32px,6vw,88px)]">
          <header className="lg:sticky lg:top-22">
            <p className="text-ink-3 text-[15px]">FAQ</p>
            <h2 className="mt-3 max-w-[14ch] text-[30px] tracking-[-0.02em] text-balance md:text-[36px]">
              Questions people ask before signing up
            </h2>
          </header>

          <div className="grid gap-3">
            {FAQ.map((item) => (
              <details
                key={item.question}
                name="faq"
                className="card group p-5"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[16px] tracking-[-0.01em] md:text-[17px] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden
                    className="bg-panel text-ink-3 group-open:bg-ink ease-soft ml-auto grid size-7 shrink-0 place-items-center rounded-full text-[16px] leading-none transition-colors duration-200 group-open:text-white"
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
          </div>
        </div>
      </section>

      <Cta />
    </main>
  );
}
