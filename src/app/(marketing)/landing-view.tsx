import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/marketing/Button";
import { PlanGrid } from "@/features/pricing/components/PlanGrid";
import { AppWindow } from "./_sections/app-window";
import { Cta } from "./_sections/cta";
import { MarkingScene } from "./_sections/marking";
import { Mosaic } from "./_sections/mosaic";
import "./landing.css";

const SPEC_CODES = [
  "OCR A H420",
  "AQA 7405",
  "AQA 7408",
  "Edexcel 9MA0",
  "CIE 9700",
  "AQA 8464",
  "OCR J250",
  "Edexcel 1MA1",
];

// The date is the point: a pledge that can be quietly edited is not one.
const PLEDGE_DATED = "29 August 2026";

const PLEDGE = [
  {
    no: "01",
    claim: "Every past paper we can legally host is free, forever.",
    rest: "No trial, no card, no countdown.",
  },
  {
    no: "02",
    claim: "The marking is a model reading a mark scheme.",
    rest: "It is fast and it is specific, and it is not your teacher.",
  },
  {
    no: "03",
    claim: "You can see why it gave every mark.",
    rest: "Each one points at the marking point it came from.",
  },
  {
    no: "04",
    claim: "We launched this month, so there are no reviews yet.",
    rest: "When there are, they'll be real ones with names on them.",
  },
  {
    no: "05",
    claim: "Your answers are yours.",
    rest: "They are not used to train anything, and you can delete the lot in one click.",
  },
  {
    no: "06",
    claim: "If a mark looks wrong, tell us and it goes to a human.",
    rest: "That's how the marking gets better.",
  },
  {
    no: "07",
    claim: "We say when the marking is unsure.",
    rest: "Low-confidence marks are flagged, not quietly averaged in.",
  },
  {
    no: "08",
    claim: "You can take your work with you.",
    rest: "Every answer and mark exports in one file, any time.",
  },
];

const MEMORY_ROWS = [
  {
    label: "It counts down to your actual exam date.",
    body: "Set the paper, and the schedule compresses as the date gets closer instead of running the same intervals all year.",
  },
  {
    label: "What you got wrong comes back sooner.",
    body: "A marking point you dropped in a six-marker becomes a card, automatically.",
  },
  {
    label: "It's the same content as the question bank.",
    body: "Nothing to re-enter. The facts are already tagged to your spec.",
  },
  {
    label: "Ten minutes is a real session.",
    body: "Built to fit a bus ride, not to demand a study block you don't have.",
  },
];

export function LandingView() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="pair pair--hero">
          <div className="hero__copy">
            <p className="t-overline trim">
              GCSE &amp; A-Level · OCR · AQA · Edexcel · CIE
            </p>
            <h1 className="display d1 trim hero-h1">
              Your answer marked against the official mark scheme
            </h1>
            <div className="hero__actions">
              <ButtonLink href="/signup" size="lg">
                Mark my first answer
              </ButtonLink>
              <ButtonLink href="#marking" size="lg" variant="outline">
                See a marked answer
              </ButtonLink>
            </div>
          </div>
          <p className="t-lede trim pair__lede">
            Questions tagged to your spec points, whole past papers, and a
            working grade that moves with every mark.
          </p>
        </div>
        <div className="hero__stage">
          <AppWindow />
        </div>
      </section>

      <section className="spec-strip" aria-label="Specifications covered">
        <div className="spec-strip__inner">
          <p className="t-overline trim">Specifications covered at launch</p>
          <ul className="spec-strip__list t-label">
            {SPEC_CODES.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </div>
      </section>

      <Mosaic />

      <MarkingScene />

      {/* The pledge is drawn as ruled ground, not as eight objects: hairlines
          divide it into square cells and a marker sits at every intersection,
          so the promises read as one document with eight clauses. */}
      <section className="pledge bg-panel/40" id="promises">
        <div className="mx-auto max-w-[1200px]">
          <header className="flex flex-wrap items-start justify-between gap-x-16 gap-y-6 pb-12">
            <div>
              <p className="text-[15px] text-ink-3">Our promises</p>
              <h2 className="mt-3 max-w-[16ch] text-[44px] leading-[1.06] tracking-[-0.03em]">
                Straight answers before you sign up
              </h2>
            </div>
            <p className="max-w-[42ch] text-[16px] leading-[1.55] text-ink-2">
              Eight of them, numbered and dated. What the marking actually is,
              what it costs, what happens to your answers, and the one question
              we can&rsquo;t answer yet.
            </p>
          </header>

          <ol className="grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {PLEDGE.map((c) => (
              <li
                key={c.no}
                className="relative border-b border-r border-line p-7 transition-colors duration-200 hover:bg-canvas sm:aspect-square"
              >
                <span className="tnum text-[13px] text-ink-3">{c.no}</span>
                <p className="mt-6 text-[17px] font-medium leading-snug tracking-[-0.01em] text-ink">
                  {c.claim}
                </p>
                <p className="mt-2.5 text-[14px] leading-[1.55] text-ink-2">
                  {c.rest}
                </p>

                <span
                  aria-hidden
                  className="absolute bottom-[-2.5px] right-[-2.5px] size-[5px] rounded-full bg-ink-4"
                />
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
            <span className="text-[14px] text-ink-3">
              This version: {PLEDGE_DATED}
            </span>
            <a
              href="/terms"
              className="inline-flex items-center gap-1.5 text-[14px] text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-ink"
            >
              Every change to this list is dated
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="memory" id="memory">
        <div className="memory__inner">
          <header className="pair pair--stack memory__head">
            <h2 className="display d2 trim">Your exam date sets the schedule</h2>
            <p className="t-lede trim pair__lede">
              Not a generic review queue. The intervals are computed back from
              the paper you are actually sitting, and the cards come from marks
              you dropped.
            </p>
          </header>
          <div className="memory__rows">
            {MEMORY_ROWS.map((row, i) => (
              <details
                key={row.label}
                name="memory"
                className="memory__row"
                open={i === 0}
              >
                <summary className="t-title">
                  <span>{row.label}</span>
                </summary>
                <p className="t-body-sm hushed">{row.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="pricing__inner">
          <header className="pair pair--stack pair--center pricing__head">
            <h2 className="display d5 trim">The free plan is not a trial</h2>
            <p className="t-lede trim pair__lede">
              Free covers the whole question bank, every past paper we can
              legally host, and your working grade. No card, no expiry. Pro adds
              unlimited marking, Ask Onely on any paper, and flashcard
              scheduling tied to your exam dates.
            </p>
          </header>
          <PlanGrid variant="public" headingLevel={3} />
        </div>
      </section>

      <Cta />
    </main>
  );
}
