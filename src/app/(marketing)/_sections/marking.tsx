import { cn } from "@/design-system";

type Clause = {
  pre?: string;
  flagged?: string;
  post?: string;
  band?: string;
  problem?: string;
  rewrite?: string;
};

// At most one flagged phrase per line so its margin note is unambiguous.
const SCRIPT: Clause[] = [
  {
    pre: "Subject: Cash not dispensed at ATM on 14 March 2026, account debited.",
  },
  {
    pre: "I am writing to report that ₹10,000 was debited from my account but the machine did not dispense the cash.",
  },
  {
    pre: "The transaction took place at your Andheri East ATM ",
    flagged: "at around 7 pm",
    post: ".",
    band: "MP1",
    problem:
      "A complaint with no transaction reference and no exact time cannot be traced.",
    rewrite:
      "at 7.12 pm, transaction reference 5540118, as printed on the slip",
  },
  {
    flagged: "Kindly do the needful at the earliest",
    post: ".",
    band: "MP3",
    problem:
      "A stock phrase in place of the request the letter exists to make.",
    rewrite:
      "I request that ₹10,000 be reversed to my account within seven working days",
  },
  {
    flagged: "Thanking you",
    post: ".",
    band: "MP4",
    problem: "There is no close. A formal letter is not finished here.",
    rewrite:
      "Yours faithfully, then your name, account number and today's date",
  },
];

/* The four bands the marker actually scores, split 35/20/30/15 across a 10-mark letter exactly as the server does. */
const BANDS = [
  {
    mp: "MP1",
    label: "Content and relevance",
    weight: "35%",
    score: 72,
    awarded: "2.5",
    outOf: "3.5",
    comment:
      "The debit is stated plainly, but the reference and the exact time are missing.",
  },
  {
    mp: "MP2",
    label: "Organisation",
    weight: "20%",
    score: 65,
    awarded: "1.5",
    outOf: "2.0",
    comment: "One block. Facts, then the request, then the close.",
  },
  {
    mp: "MP3",
    label: "Language and grammar",
    weight: "30%",
    score: 58,
    awarded: "1.5",
    outOf: "3.0",
    comment:
      "Stock phrasing stands in for the request in the line that matters most.",
  },
  {
    mp: "MP4",
    label: "Format and length",
    weight: "15%",
    score: 80,
    awarded: "1.0",
    outOf: "1.5",
    comment: "Subject line and salutation are there; the close is not.",
  },
];

export function MarkingScene() {
  return (
    <section
      className="marking-scene bg-canvas border-line border-t px-5 py-[clamp(64px,7vw,104px)] sm:px-8 lg:px-16"
      id="marking"
    >
      <div className="mx-auto max-w-300">
        <header className="mb-12 grid items-start gap-x-[clamp(32px,6vw,96px)] gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <h2 className="max-w-[13em] text-[30px] tracking-[-0.02em] text-balance md:text-[36px] lg:text-[40px]">
            Four bands, weighted — and your own words quoted back
          </h2>
          <p className="text-ink-2 max-w-[38ch] text-[18px] leading-relaxed text-pretty lg:pt-1 lg:text-[19px]">
            A descriptive letter, marked. The examiner scores content,
            organisation, language and format; every fix in the margin quotes
            the line it came from and gives you the replacement.
          </p>
        </header>

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
                [10]
              </span>
              <span className="sr-only">10 marks</span>
            </div>

            <div className="mt-6 grid grid-cols-[40px_minmax(0,1fr)] items-baseline gap-3 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-4">
              <span
                className="text-ink-3 text-[14px] tabular-nums"
                aria-hidden="true"
              >
                Q 1
              </span>
              <p className="max-w-[44ch] text-[21px] leading-snug lg:text-[22px]">
                Write to your branch manager about an ATM withdrawal that was
                debited but never dispensed, and say what you expect done.
              </p>
            </div>

            <div className="lg:after:bg-bad/30 relative mt-8 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_260px] lg:pl-14 lg:after:absolute lg:after:inset-y-0 lg:after:right-65 lg:after:w-px lg:after:content-[''] xl:grid-cols-[minmax(0,1fr)_300px] xl:after:right-75">
              {SCRIPT.map((line, i) => (
                <ScriptLine key={i} clause={line} />
              ))}

              {/* Overshooting the start is what reads as hand-drawn. */}
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
                  6.5
                </span>
                <span className="text-ink-3 text-[14px]" aria-hidden="true">
                  of 10
                </span>
                <span className="sr-only">
                  Total for the letter: 6.5 of 10 marks.
                </span>
              </div>
            </div>
          </div>

          {/* The fold: a perforated rule, not a border. */}
          <div className="bg-panel relative px-6 py-10 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[repeating-linear-gradient(to_right,var(--color-line-2)_0_6px,transparent_6px_13px)] before:content-[''] sm:px-10">
            <span className="text-ink-3 absolute top-0 left-6 text-[12.5px] sm:left-10">
              The band sheet, held back until you&rsquo;ve answered
            </span>
            <p className="text-ink-3 mt-6 text-[14px]">
              Four bands, each worth a fixed share of the paper
            </p>

            <ol className="mt-4">
              {BANDS.map((band) => (
                <li
                  key={band.mp}
                  data-mp={band.mp}
                  className="border-line grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-t py-3 first:border-t-0"
                >
                  <span className="text-[14px] font-medium">{band.label}</span>
                  <span className="text-ink-3 flex gap-4 text-[12.5px] tabular-nums">
                    <span>{band.weight}</span>
                    <span className="text-brand min-w-13 text-right">
                      {band.awarded} / {band.outOf}
                    </span>
                  </span>
                  <span className="text-ink-2 col-start-1 max-w-[62ch] text-[13px]">
                    {band.comment}
                  </span>
                </li>
              ))}
            </ol>

            <div className="border-line-2 mt-8 grid items-start gap-8 border-t pt-6 sm:grid-cols-2 sm:items-end sm:gap-x-[clamp(24px,4vw,72px)]">
              <div>
                <ol className="grid grid-cols-4 gap-2 sm:gap-3">
                  {BANDS.map((band) => (
                    <li
                      key={band.mp}
                      data-mp={band.mp}
                      className="grid justify-items-center gap-2"
                    >
                      <span
                        className="bg-ink/8 h-2.5 w-full overflow-hidden rounded-[3px] shadow-[inset_0_0_0_1px_rgb(10_10_10/0.07)]"
                        aria-hidden="true"
                      >
                        <span
                          className="bg-brand block h-full rounded-[3px]"
                          style={{ width: `${band.score}%` }}
                        />
                      </span>
                      <span className="text-ink-3 text-[12.5px] tabular-nums">
                        {band.awarded}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="text-ink-3 mt-4 text-[12.5px]">
                  One bar per band, filled to what the examiner scored it.
                </p>
              </div>

              <p className="text-ink-2 [&_strong]:text-ink max-w-[46ch] text-[14px] [&_strong]:font-semibold">
                <strong>Six and a half of ten.</strong> Length was never the
                problem. The marks went on a reference that was never given and
                a close that was never written.
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
  const flaggedFix = Boolean(clause.band);

  return (
    <>
      {/* skip-ink is off: a pen does not lift for a descender. */}
      <p
        className="script-rule col-start-1 min-h-14 self-stretch text-[15px] leading-7"
        data-mp={clause.band}
      >
        {clause.pre}
        {clause.flagged ? (
          <span className="decoration-ink/40 underline decoration-wavy decoration-1 underline-offset-4">
            {clause.flagged}
          </span>
        ) : null}
        {clause.post}
      </p>

      <div
        className={cn(
          "col-start-1 grid gap-y-1 self-start",
          "ml-4 pl-4 lg:col-start-2 lg:mx-0 lg:my-0 lg:pl-5",
          "mt-3 mb-6 lg:mt-0 lg:mb-0",
          flaggedFix && "border-line-2 border-l-2 lg:border-l-0",
        )}
        data-mp={clause.band}
      >
        {flaggedFix ? (
          <>
            <span className="text-ink-2 text-[13px]">{clause.problem}</span>
            <span className="text-brand text-[14px]">
              <span className="sr-only">write instead: </span>
              {clause.rewrite}
            </span>
          </>
        ) : null}
      </div>
    </>
  );
}
