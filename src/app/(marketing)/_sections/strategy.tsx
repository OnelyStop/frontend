import { cn } from "@/design-system";
import { SteadyList } from "./steady-list";
import { EYEBROW, H2, PANEL, Shell } from "./surface";

const ROWS = [
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

const VERDICTS = [
  {
    topic: "Simplification",
    call: "bank",
    tone: "bg-[#d8f0e5] text-[#23634a]",
  },
  {
    topic: "Floor puzzles",
    call: "if time",
    tone: "bg-[#fbf0c6] text-[#7a5a12]",
  },
  { topic: "DI sets", call: "skip", tone: "bg-[#fbe1ea] text-[#8b3b5d]" },
];

export function Strategy() {
  return (
    <Shell tone="bg-[#cfe3f3]" id="attempt-map">
      <div className="grid items-start gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-14 lg:py-16">
        <header>
          <p className={cn(EYEBROW, "text-[#264b66]/75")}>Attempt map</p>
          <h2 className={cn(H2, "mt-5 max-w-[13ch]")}>
            Negative marking sets the strategy
          </h2>
          <p className="mt-6 max-w-[40ch] text-[16px] leading-relaxed text-[#2a4a60]">
            Not a generic score. The attempt map reads accuracy against pace
            from your own sittings, and prices a quarter-mark penalty into every
            question you might attempt.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Example calls">
            {VERDICTS.map(({ topic, call, tone }) => (
              <li
                key={topic}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] shadow-xs",
                  tone,
                )}
              >
                {topic} · <span className="font-semibold">{call}</span>
              </li>
            ))}
          </ul>
        </header>

        <SteadyList className="grid content-start gap-3">
          {ROWS.map((row, i) => (
            <details
              key={row.label}
              name="strategy"
              open={i === 0}
              className={cn(PANEL, "group px-6 py-1")}
            >
              <summary className="text-ink flex cursor-pointer list-none items-center gap-4 py-4 text-[16px] font-medium tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                <span>{row.label}</span>
                <span
                  aria-hidden
                  className="text-ink-3 ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f0f8] transition-colors group-open:bg-[#264b66] group-open:text-white"
                >
                  <span className="size-2 -translate-y-px rotate-45 border-r-[1.5px] border-b-[1.5px] border-current transition-transform duration-300 group-open:translate-y-px group-open:-rotate-135" />
                </span>
              </summary>
              <p className="text-ink-2 max-w-[54ch] pb-5 text-[14.5px] leading-relaxed">
                {row.body}
              </p>
            </details>
          ))}
        </SteadyList>
      </div>
    </Shell>
  );
}
