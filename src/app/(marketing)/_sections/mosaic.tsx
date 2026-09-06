import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/design-system";

type Tile = {
  title: string;
  body: string;
  href?: string;
  col: string;
  row: string;
  mock?: "band" | "papers" | "sources" | "chips" | "queue" | "due" | "posts";
};

// Hand-placed and deliberately non-uniform — the non-uniformity is the cure
// for the four-up grid this replaces.
const TILES: Tile[] = [
  {
    title: "Mocks",
    body: "Full papers under real sectional timing, with the key held back until you're done.",
    href: "/signup",
    col: "1 / span 2",
    row: "1",
    mock: "papers",
  },
  {
    title: "Attempt map",
    body: "Accuracy against pace, per topic. What to bank, what to try if there's time, what to skip.",
    href: "#attempt-map",
    col: "3 / span 2",
    row: "1",
    mock: "chips",
  },
  {
    title: "Cutoff band",
    body: "One reading per section that moves when your sittings move: below the cutoff, at it, safe, strong.",
    col: "5 / span 4",
    row: "1",
    mock: "band",
  },
  {
    title: "Drills",
    body: "A short set aimed at the topics costing you marks, timed like the section it came from.",
    href: "/signup",
    col: "1 / span 2",
    row: "2",
    mock: "queue",
  },
  {
    title: "Community",
    body: "Doubts ranked by how many people are stuck there. Five posts a month free, fifteen on Pro.",
    col: "3 / span 2",
    row: "2",
    mock: "posts",
  },
  {
    title: "Flashcards",
    body: "Current affairs, banking awareness and formulae, back on a schedule before the exam.",
    href: "/signup",
    col: "5 / span 2",
    row: "2",
    mock: "due",
  },
  {
    title: "Current affairs",
    body: "One grounded question per major story, from the day's news and RBI, PIB and SEBI.",
    href: "/signup",
    col: "7 / span 2",
    row: "2",
    mock: "sources",
  },
];

const MOCK = "mt-5";
const ROW = "border-line flex items-baseline gap-2 border-b pb-2 text-[12.5px]";

function TileMock({ kind }: { kind: NonNullable<Tile["mock"]> }) {
  if (kind === "band") {
    return (
      <div className={`${MOCK} flex items-baseline gap-2`} aria-hidden>
        {["Below", "At cutoff", "Safe", "Strong"].map((band) => (
          <span
            key={band}
            className={cn(
              "flex-1 border-t-2 py-1 text-center text-[13px] font-semibold",
              band === "Safe"
                ? "border-brand text-brand"
                : "border-line text-ink-3",
            )}
          >
            {band}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "posts") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {[
          ["Priya", "Attempt DI before puzzles, or after?"],
          ["Rahul", "How is the 0.25 applied across sections?"],
          ["Meera", "GA sources that actually match RBI Grade B?"],
        ].map(([who, q]) => (
          <div key={who} className={ROW}>
            <span className="text-ink-2 shrink-0 font-semibold">{who}</span>
            <span className="text-ink-3 truncate">{q}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "papers") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {[
          ["IBPS PO", "Prelims · 60 min"],
          ["SBI Clerk", "Mains · 160 min"],
          ["RBI Grade B", "Phase I · 120 min"],
        ].map(([exam, paper]) => (
          <div key={exam} className={`${ROW} justify-between gap-3`}>
            <span className="text-[14px] font-medium">{exam}</span>
            <span className="text-ink-3 tnum">{paper}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "chips") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {[
          "Simplification · bank",
          "Floor puzzles · if time",
          "DI sets · skip",
        ].map((f, i) => (
          <span
            key={f}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-[12.5px]",
              i === 2
                ? "border-brand bg-brand-soft text-brand"
                : "border-line text-ink-3",
            )}
          >
            {f}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "queue") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {[
          ["Q3", "Simplification"],
          ["Q7", "Floor-based puzzle"],
          ["Q11", "Error spotting"],
        ].map(([q, t]) => (
          <div key={q} className={`${ROW} text-ink-3 gap-3`}>
            <span className="tnum text-ink-2 text-[13px] font-medium">{q}</span>
            <span>{t}</span>
          </div>
        ))}
        <p className="tnum mt-1 text-[16px] font-medium">12:00</p>
      </div>
    );
  }
  if (kind === "due") {
    return (
      <div className={`${MOCK} flex gap-4`} aria-hidden>
        {["Today", "Tue", "Fri", "In 2 wks"].map((d, i) => (
          <div
            key={d}
            className="text-ink-3 grid justify-items-center gap-2 text-[12.5px]"
          >
            <i
              className="bg-brand rounded-pill size-2.5"
              style={{ opacity: 1 - i * 0.22 }}
            />
            <span>{d}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`${MOCK} text-ink-3 grid gap-1`} aria-hidden>
      {["RBI", "PIB", "SEBI", "The day's news"].map((c) => (
        <span key={c} className="text-[12.5px]">
          {c}
        </span>
      ))}
    </div>
  );
}

export function Mosaic() {
  return (
    <section
      className="px-5 py-[clamp(64px,7vw,104px)] sm:px-8 lg:px-16"
      id="features"
    >
      <div className="mx-auto max-w-300">
        <header className="mb-[clamp(32px,4.5vw,64px)] grid items-start gap-x-[clamp(32px,6vw,96px)] gap-y-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <h2 className="max-w-[13em] text-[30px] tracking-[-0.02em] text-balance md:text-[36px] lg:text-[40px]">
            The whole of preparation in one tab
          </h2>
          <p className="text-ink-2 text-[18px] leading-relaxed lg:text-[19px]">
            Mocks, drills, current affairs, the marker and the community are one
            product, not five apps and five logins.
          </p>
        </header>

        {/* The gaps are the borders: no cell carries one, so junctions never
            double-seam and the grid reads as a single object. */}
        <div className="bg-line-2 rounded-ctl grid gap-px overflow-hidden p-px md:grid-cols-4 lg:grid-cols-8">
          {TILES.map((tile) => (
            <article
              key={tile.title}
              className={cn(
                "bg-canvas group relative flex flex-col gap-2 overflow-hidden p-5 transition-colors md:col-span-2",
                "lg:col-(--col) lg:row-(--row)",
                tile.href && "hover:bg-panel",
              )}
              style={
                { "--col": tile.col, "--row": tile.row } as React.CSSProperties
              }
            >
              <h3 className="text-ink-3 text-[16px] font-medium">
                {tile.title}
              </h3>
              <p className="max-w-[34ch] text-[15px] leading-relaxed">
                {tile.body}
              </p>
              {tile.mock ? <TileMock kind={tile.mock} /> : null}
              {tile.href ? (
                <>
                  <span
                    className="bg-ink/5 rounded-pill text-ink group-hover:bg-ink/10 absolute top-4 right-4 grid size-6 place-items-center opacity-0 backdrop-blur-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                    aria-hidden
                  >
                    <ArrowUpRight
                      size={14}
                      strokeWidth={2}
                      className="-rotate-45 transition-transform group-hover:rotate-0"
                    />
                  </span>
                  {/* A pseudo-element covers the tile, so the whole card is the
                      link without nesting an interactive element inside one. */}
                  <Link
                    href={tile.href}
                    className="static before:absolute before:inset-0 before:z-0 before:cursor-pointer before:content-['']"
                  >
                    <span className="sr-only">{tile.title}</span>
                  </Link>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
