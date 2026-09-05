import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/design-system";
import { EXAMS } from "@/data/navigation";
import type { PlanPrice } from "@/features/billing/types";
import { PlanGrid } from "@/features/pricing/components/PlanGrid";
import { AppWindow } from "./_sections/app-window";
import { Cta } from "./_sections/cta";
import { MarkingScene } from "./_sections/marking";
import { Mosaic } from "./_sections/mosaic";

// The date is the point: a pledge that can be quietly edited is not one.
const PLEDGE_DATED = "5 September 2026";

const GUTTER = "px-5 sm:px-8 lg:px-16";
const SECTION_Y = "py-[clamp(64px,7vw,104px)]";

const HERO_GLOW: React.CSSProperties = {
  inset: "-8% -4% 18%",
  borderRadius: "50%",
  filter: "blur(44px)",
  opacity: 0.92,
  background: [
    "radial-gradient(46% 62% at 20% 46%, #bcd4ff 0%, transparent 68%)",
    "radial-gradient(42% 58% at 60% 32%, #cfc6ff 0%, transparent 70%)",
    "radial-gradient(44% 60% at 88% 58%, #b6ecdd 0%, transparent 68%)",
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
    rest: "Each one points at the rubric line it came from.",
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
    claim: "If a mark looks wrong, tell us and it goes to a human.",
    rest: "That's how the marking gets better.",
  },
  {
    no: "07",
    claim: "Every current-affairs question names its source.",
    rest: "Written from the day's reporting and checked against it before you see it.",
  },
  {
    no: "08",
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
      <section className={`${GUTTER} pt-[clamp(56px,8vw,120px)]`}>
        <div className="mx-auto grid max-w-300 items-end gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div>
            <p className="text-ink-3 text-[14px]">{EXAMS.join(" · ")}</p>
            <h1 className="mt-4 text-[36px] leading-[1.08] tracking-[-0.022em] text-balance md:text-[44px] lg:text-[52px]">
              Clear every sectional cutoff
            </h1>
            <div className="mt-14 flex flex-wrap gap-4">
              <ButtonLink href="/signup" size="lg">
                Sit a free mock
              </ButtonLink>
              <ButtonLink href="#marking" size="lg" variant="secondary">
                See a marked answer
              </ButtonLink>
            </div>
          </div>
          <p className="text-ink-2 text-[18px] leading-relaxed lg:text-[19px]">
            Full mocks under real sectional timing, drills aimed at what costs
            you marks, and one grounded question per current-affairs story.
            Scored the way the paper is, negative marking included.
          </p>
        </div>

        {/* The one colour moment on the page: a soft field the product sits on.
            Three blurred radials, so no single hue reads as a brand colour. */}
        <div className="relative isolate mx-auto mt-[clamp(32px,4.5vw,64px)] max-w-300">
          <div
            aria-hidden
            className="absolute inset-0 -z-1"
            style={HERO_GLOW}
          />
          <AppWindow />
        </div>
      </section>

      <section
        className={`${GUTTER} border-line border-y py-10`}
        aria-label="Exams covered"
      >
        <div className="mx-auto flex max-w-300 flex-wrap items-baseline gap-8">
          <p className="text-ink-3 text-[14px]">Exams covered at launch</p>
          <ul className="text-ink-3 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            {EXAMS.map((exam) => (
              <li key={exam}>{exam}</li>
            ))}
          </ul>
        </div>
      </section>

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
              Eight of them, numbered and dated. What the marking actually is,
              what it costs, what happens to your answers, and the one question
              we can&rsquo;t answer yet.
            </p>
          </header>

          <ol className="border-line grid grid-cols-1 border-t border-l sm:grid-cols-2 lg:grid-cols-4">
            {PLEDGE.map((c) => (
              <li
                key={c.no}
                className="border-line hover:bg-canvas relative border-r border-b p-7 transition-colors duration-200 sm:aspect-square"
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
                  className="bg-ink-4 absolute right-[-2.5px] bottom-[-2.5px] size-1.25 rounded-full"
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
            Free covers the knowledge base, two full mocks a month, a week of
            current affairs and your private notes. No card, no expiry. Pro adds
            unlimited mocks and drills, descriptive marking, the full
            current-affairs archive and Ask Onely on any passage.
          </p>
          <PlanGrid
            variant="public"
            headingLevel={3}
            prices={prices}
            billingEnabled={billingEnabled}
          />
        </div>
      </section>

      <Cta />
    </main>
  );
}
