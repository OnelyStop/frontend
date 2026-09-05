import { cn } from "@/design-system";

type Clause = {
  pre?: string;
  hit?: string;
  slip?: string;
  post?: string;
  mp?: string;
  quote?: string;
  gloss?: string;
};

// At most one decoration per line so its margin note is unambiguous.
const SCRIPT: Clause[] = [
  {
    hit: "Subject: Request for premature closure of fixed deposit no. 4471",
    mp: "R1",
    quote: "premature closure of fixed deposit",
  },
  {
    pre: "I am writing to ",
    slip: "ask about my fixed deposit",
    post: " held at your branch.",
    gloss:
      "Close to R2, but not it. A letter that asks about a deposit has not asked to close it.",
  },
  {
    pre: "The deposit of ",
    hit: "₹2,00,000 was opened on 12 March 2025 for two years",
    post: ".",
    mp: "R3",
    quote: "₹2,00,000 … 12 March 2025 … two years",
    gloss:
      "One point, not three. The rubric wants all of amount, date and term.",
  },
  {
    pre: "I need the funds now as ",
    hit: "my father's surgery is scheduled for next month",
    post: ".",
    mp: "R4",
    quote: "surgery is scheduled for next month",
  },
  {
    pre: "Kindly ",
    hit: "credit the proceeds to my savings account at the same branch",
    post: ".",
    mp: "R5",
    quote: "credit the proceeds to my savings account",
  },
  {
    slip: "I hope you will do the needful at the earliest",
    post: ".",
    gloss:
      "No point. A stock phrase is not a close; R6 wants a name, an address and a date.",
  },
];

const SCHEME = [
  {
    mp: "R1",
    text: "subject line names the request ;",
    rule: ["ALLOW", "closure / withdrawal before maturity"],
    given: true,
  },
  {
    mp: "R2",
    text: "opening sentence states the purpose ;",
    rule: ["DO NOT ACCEPT", "a purpose only implied by later lines"],
    given: false,
  },
  {
    mp: "R3",
    text: "deposit identified: amount, date and term ;",
    given: true,
  },
  {
    mp: "R4",
    text: "reason for closing before maturity ;",
    rule: ["IGNORE", "‘urgent need’ unqualified"],
    given: true,
  },
  {
    mp: "R5",
    text: "instruction for the proceeds / account to credit ;",
    given: true,
  },
  {
    mp: "R6",
    text: "formal close with name, address and date ;",
    given: false,
  },
];

function Tick() {
  return (
    <svg
      className="marking-ink text-brand row-start-1 mt-1.5 h-4 w-4.5 -rotate-3"
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        pathLength={1}
        d="M2 9.2 6.8 14.6 18 1.8"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarkingScene() {
  return (
    <section
      className="marking-scene bg-canvas border-line border-t px-5 py-[clamp(64px,7vw,104px)] sm:px-8 lg:px-16"
      id="marking"
    >
      <div className="mx-auto max-w-300">
        <header className="mb-12 grid items-start gap-x-[clamp(32px,6vw,96px)] gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <h2 className="max-w-[13em] text-[30px] tracking-[-0.02em] text-balance md:text-[36px] lg:text-[40px]">
            Every mark, traced to the line that earned it
          </h2>
          <p className="text-ink-2 max-w-[38ch] text-[18px] leading-relaxed text-pretty lg:pt-1 lg:text-[19px]">
            A descriptive letter, marked. Everything in the margin is the
            marker&rsquo;s ink. Each tick names the rubric point it came from
            and points at the exact words that earned it.
          </p>
        </header>

        {/* One object with a fold, not two cards: the seam between the script
            and the scheme is a perforation, never a gap. */}
        <div className="bg-canvas border-line overflow-hidden rounded-[20px] border">
          <div className="relative isolate px-6 pt-8 pb-12 sm:px-10">
            <div className="script-grain pointer-events-none absolute inset-0 -z-1 opacity-[0.035]" />

            <div className="border-line text-ink-3 flex items-baseline justify-between gap-4 border-b pb-4 text-[12.5px]">
              <span className="tabular-nums">
                SBI PO Mains &middot; Descriptive &middot; Letter
              </span>
              <span
                className="text-ink-2 text-[14px] font-semibold tabular-nums"
                aria-hidden="true"
              >
                [6]
              </span>
              <span className="sr-only">6 rubric points available</span>
            </div>

            <div className="mt-6 grid grid-cols-[40px_minmax(0,1fr)] items-baseline gap-3 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-4">
              <span
                className="text-ink-3 text-[14px] tabular-nums"
                aria-hidden="true"
              >
                Q 1
              </span>
              <p className="max-w-[44ch] text-[21px] leading-snug lg:text-[22px]">
                Write a letter to your branch manager requesting premature
                closure of a fixed deposit, giving the reason.
              </p>
            </div>

            {/* Clause and margin note are siblings of one grid, so each note
                stays level with its line however the text reflows. The red rule
                is the margin a real script has — furniture, so every mark on the
                page is still the accent. */}
            <div className="lg:after:bg-bad/30 relative mt-8 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_260px] lg:pl-14 lg:after:absolute lg:after:inset-y-0 lg:after:right-65 lg:after:w-px lg:after:content-[''] xl:grid-cols-[minmax(0,1fr)_300px] xl:after:right-75">
              {SCRIPT.map((line, i) => (
                <ScriptLine key={i} clause={line} />
              ))}

              {/* An overdrawn ring: the overshoot past its own start is what
                  reads as hand-drawn. */}
              <div className="relative col-start-1 mt-8 flex items-baseline gap-2 justify-self-start px-5 py-2 lg:col-start-2 lg:ml-5">
                <svg
                  className="marking-ink text-brand absolute -inset-x-2 -inset-y-1 h-auto w-auto overflow-visible"
                  viewBox="0 0 100 56"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    pathLength={1}
                    d="M74 6C40-2 8 6 5 24 2 42 30 53 58 52 86 51 99 40 95 24 92 12 78 5 64 5"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span
                  className="text-brand text-[34px] leading-none font-semibold tracking-[-0.02em] tabular-nums"
                  aria-hidden="true"
                >
                  4
                </span>
                <span className="text-ink-3 text-[14px]" aria-hidden="true">
                  of 6
                </span>
                <span className="sr-only">
                  Total for the letter: 4 of 6 rubric points.
                </span>
              </div>
            </div>
          </div>

          {/* The fold: a perforated rule, not a border. */}
          <div className="bg-panel relative px-6 py-10 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[repeating-linear-gradient(to_right,var(--color-line-2)_0_6px,transparent_6px_13px)] before:content-[''] sm:px-10">
            <span className="text-ink-3 absolute top-0 left-6 text-[12.5px] sm:left-10">
              Rubric, held back until you&rsquo;ve answered
            </span>
            <p className="text-ink-3 mt-6 text-[14px]">
              Credit points for the letter, in our wording
            </p>

            <ol className="mt-4">
              {SCHEME.map((point) => (
                <li
                  key={point.mp}
                  data-mp={point.mp}
                  className="border-line grid grid-cols-[52px_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 border-t py-3 first:border-t-0 sm:grid-cols-[52px_minmax(0,1fr)_auto]"
                >
                  <span
                    className={cn(
                      "text-[12.5px] font-semibold tabular-nums",
                      point.given ? "text-brand" : "text-ink-3",
                    )}
                  >
                    {point.mp}
                  </span>
                  <span
                    className={cn(
                      "max-w-[62ch] text-[14px]",
                      point.given || "text-ink-2",
                    )}
                  >
                    {point.text}
                  </span>
                  <span className="text-ink-3 col-start-2 flex gap-4 text-[12.5px] tabular-nums sm:col-start-3">
                    <span className="min-w-7">(1)</span>
                    <span className={point.given ? "text-brand" : undefined}>
                      {point.given ? "given" : "not given"}
                    </span>
                  </span>
                  {point.rule ? (
                    <span className="text-ink-3 col-start-2 text-[12.5px]">
                      <b className="text-ink-2 font-semibold">
                        {point.rule[0]}
                      </b>{" "}
                      {point.rule[1]}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>

            <div className="border-line-2 mt-8 grid items-start gap-8 border-t pt-6 sm:grid-cols-2 sm:items-end sm:gap-x-[clamp(24px,4vw,72px)]">
              <div>
                <ol className="grid grid-cols-6 gap-1 sm:gap-2">
                  {SCHEME.map((point) => (
                    <li
                      key={point.mp}
                      data-mp={point.mp}
                      className="grid justify-items-center gap-2"
                    >
                      <span
                        className={cn(
                          "h-2.5 w-full rounded-[3px]",
                          point.given
                            ? "bg-brand"
                            : "bg-ink/8 shadow-[inset_0_0_0_1px_rgb(10_10_10/0.07)]",
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          "text-[12.5px] tabular-nums",
                          point.given ? "text-ink-2" : "text-ink-3",
                        )}
                      >
                        {point.mp}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="text-ink-3 mt-4 text-[12.5px]">
                  One cell per rubric point. Four filled, two left on the page.
                </p>
              </div>

              <p className="text-ink-2 [&_strong]:text-ink max-w-[46ch] text-[14px] [&_strong]:font-semibold">
                <strong>Four of six.</strong> Length was never the problem. R2
                and R6 are simply not written down. The band is decided by the
                points you hit, not by how much you wrote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Clause and margin note are grid siblings so the note stays level on reflow.
function ScriptLine({ clause }: { clause: Clause }) {
  const given = Boolean(clause.mp);

  return (
    <>
      {/* Marks are drawn, not filled — the script has to stay readable as
          writing. skip-ink is off: a pen does not lift for a descender. */}
      <p
        className="script-rule col-start-1 min-h-14 self-stretch text-[15px] leading-7"
        data-mp={clause.mp}
      >
        {clause.pre}
        {clause.hit ? (
          <span className="decoration-brand underline decoration-[1.5px] underline-offset-4 [text-decoration-skip-ink:none]">
            {clause.hit}
          </span>
        ) : null}
        {clause.slip ? (
          <span className="decoration-ink/40 underline decoration-wavy decoration-1 underline-offset-4">
            {clause.slip}
          </span>
        ) : null}
        {clause.post}
      </p>

      <div
        className={cn(
          "col-start-1 grid grid-cols-[20px_minmax(0,1fr)] gap-x-2 gap-y-1 self-start",
          "ml-4 border-l-2 pl-4 lg:col-start-2 lg:mx-0 lg:my-0 lg:border-l-0 lg:pl-5",
          "mt-3 mb-6 lg:mt-0 lg:mb-0",
          given ? "border-brand/40" : "border-line-2",
        )}
        data-mp={clause.mp}
      >
        {given ? (
          <>
            <Tick />
            <span className="text-brand col-start-2 text-[12.5px] font-semibold tabular-nums">
              {clause.mp}
            </span>
            <span className="text-ink-2 col-start-2 text-[14px]">
              <span className="sr-only">given for </span>
              &ldquo;{clause.quote}&rdquo;
            </span>
          </>
        ) : null}
        {clause.gloss ? (
          <span className="text-ink-3 col-start-2 mt-1 text-[12.5px]">
            {clause.gloss}
          </span>
        ) : null}
      </div>
    </>
  );
}
