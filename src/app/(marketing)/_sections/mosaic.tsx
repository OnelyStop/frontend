import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/design-system";

type Tile = {
  title: string;
  body: string;
  href?: string;
  col: string;
  row: string;
  mock?: "grade" | "papers" | "codes" | "filters" | "queue" | "due" | "posts";
};

// Hand-placed and deliberately non-uniform — the non-uniformity is the cure
// for the four-up grid this replaces.
const TILES: Tile[] = [
  {
    title: "Question bank",
    body: "Filter by spec point, not by chapter. Every question tagged to the line in your syllabus.",
    href: "/signup",
    col: "1 / span 2",
    row: "1",
    mock: "filters",
  },
  {
    title: "Past papers",
    body: "Whole papers, timed or untimed, with the mark scheme held back until you're done.",
    href: "/signup",
    col: "3 / span 2",
    row: "1",
    mock: "papers",
  },
  {
    title: "Working grade",
    body: "One number that moves when your marks move, per subject, per paper.",
    col: "5 / span 4",
    row: "1",
    mock: "grade",
  },
  {
    title: "PYQ mixes",
    body: "Past-year questions blended into fresh sets aimed at what you keep getting wrong.",
    href: "/signup",
    col: "1 / span 2",
    row: "2",
    mock: "queue",
  },
  {
    title: "Community",
    body: "Ask other students sitting the same paper. Five posts a month free, fifteen on Pro.",
    col: "3 / span 2",
    row: "2",
    mock: "posts",
  },
  {
    title: "Flashcards",
    body: "Dropped marking points come back on a schedule built around your exam date.",
    href: "#memory",
    col: "5 / span 2",
    row: "2",
    mock: "due",
  },
  {
    title: "Boards",
    body: "OCR, AQA, Edexcel and CIE mark the same content differently. We mark it their way.",
    col: "7 / span 2",
    row: "2",
    mock: "codes",
  },
];

const MOCK = "mt-5";
const ROW = "border-line flex items-baseline gap-2 border-b pb-2 text-[12.5px]";

function TileMock({ kind }: { kind: NonNullable<Tile["mock"]> }) {
  if (kind === "grade") {
    return (
      <div className={`${MOCK} flex items-baseline gap-2`} aria-hidden>
        {["D", "C", "B", "A", "A*"].map((g) => (
          <span
            key={g}
            className={cn(
              "flex-1 border-t-2 py-1 text-center text-[14px] font-semibold",
              g === "A" ? "border-brand text-brand" : "border-line text-ink-3",
            )}
          >
            {g}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "posts") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {[
          ["Priya", "How strict is AO3 on the 20-markers?"],
          ["Sam", "Q4(b) 2023 mark scheme wording?"],
          ["Leah", "Best order for Paper 2 revision?"],
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
        {["2024", "2023", "2022"].map((y) => (
          <div key={y} className={`${ROW} justify-between gap-3`}>
            <span className="tnum text-[15px] font-medium">{y}</span>
            <span className="text-ink-3">Paper 1 · Paper 2</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "filters") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {["3.1.2 Enzymes", "3.1.4 Transport", "4.2 Gas exchange"].map(
          (f, i) => (
            <span
              key={f}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-[12.5px]",
                i === 1
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-ink-3",
              )}
            >
              {f}
            </span>
          ),
        )}
      </div>
    );
  }
  if (kind === "queue") {
    return (
      <div className={`${MOCK} grid gap-2`} aria-hidden>
        {[
          ["Q4(b)", "Gas exchange"],
          ["Q7(c)", "Le Chatelier"],
          ["Q2(a)", "Rate equations"],
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
      {["OCR A H420", "AQA 7405", "Edexcel 9MA0", "CIE 9700"].map((c) => (
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
            The whole of revision in one tab
          </h2>
          <p className="text-ink-2 text-[18px] leading-relaxed lg:text-[19px]">
            The question bank, the past papers, the marker and the memory
            schedule are one product, not four tabs and four logins.
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
                "lg:[grid-column:var(--col)] lg:[grid-row:var(--row)]",
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
