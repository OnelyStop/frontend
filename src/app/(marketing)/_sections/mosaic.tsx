import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import "./mosaic.css";

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

function TileMock({ kind }: { kind: NonNullable<Tile["mock"]> }) {
  if (kind === "grade") {
    return (
      <div className="tile__mock tile__grade" aria-hidden>
        {["D", "C", "B", "A", "A*"].map((g) => (
          <span key={g} className={g === "A" ? "is-now" : undefined}>
            {g}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "posts") {
    return (
      <div className="tile__mock tile__posts" aria-hidden>
        {[
          ["Priya", "How strict is AO3 on the 20-markers?"],
          ["Sam", "Q4(b) 2023 mark scheme wording?"],
          ["Leah", "Best order for Paper 2 revision?"],
        ].map(([who, q]) => (
          <div key={who}>
            <span className="tile__post-who">{who}</span>
            <span className="tile__post-q">{q}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "papers") {
    return (
      <div className="tile__mock tile__papers" aria-hidden>
        {["2024", "2023", "2022"].map((y) => (
          <div key={y}>
            <span className="t-num">{y}</span>
            <span className="t-micro hushed">Paper 1 · Paper 2</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "filters") {
    return (
      <div className="tile__mock tile__filters" aria-hidden>
        {["3.1.2 Enzymes", "3.1.4 Transport", "4.2 Gas exchange"].map(
          (f, i) => (
            <span key={f} className={i === 1 ? "is-on" : undefined}>
              {f}
            </span>
          ),
        )}
      </div>
    );
  }
  if (kind === "queue") {
    return (
      <div className="tile__mock tile__queue" aria-hidden>
        {[
          ["Q4(b)", "Gas exchange"],
          ["Q7(c)", "Le Chatelier"],
          ["Q2(a)", "Rate equations"],
        ].map(([q, t]) => (
          <div key={q}>
            <span className="t-num">{q}</span>
            <span>{t}</span>
          </div>
        ))}
        <p className="tile__timer t-num">12:00</p>
      </div>
    );
  }
  if (kind === "due") {
    return (
      <div className="tile__mock tile__due" aria-hidden>
        {["Today", "Tue", "Fri", "In 2 wks"].map((d, i) => (
          <div key={d}>
            <i style={{ opacity: 1 - i * 0.22 }} />
            <span>{d}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="tile__mock tile__codes" aria-hidden>
      {["OCR A H420", "AQA 7405", "Edexcel 9MA0", "CIE 9700"].map((c) => (
        <span key={c} className="t-micro">
          {c}
        </span>
      ))}
    </div>
  );
}

export function Mosaic() {
  return (
    <section className="mosaic-section" id="features">
      <div className="mosaic-section__inner">
        <header className="pair">
          <h2 className="display d2 trim">The whole of revision in one tab</h2>
          <p className="t-lede trim pair__lede">
            The question bank, the past papers, the marker and the memory
            schedule are one product, not four tabs and four logins.
          </p>
        </header>

        <div className="mosaic">
          {TILES.map((tile) => (
            <article
              key={tile.title}
              className={`tile${tile.href ? "tile--link" : ""}`}
              style={
                { "--col": tile.col, "--row": tile.row } as React.CSSProperties
              }
            >
              <h3 className="t-title trim">{tile.title}</h3>
              <p className="t-body tile__body">{tile.body}</p>
              {tile.mock ? <TileMock kind={tile.mock} /> : null}
              {tile.href ? (
                <>
                  <span className="tile__badge" aria-hidden>
                    <ArrowUpRight size={14} strokeWidth={2} />
                  </span>
                  <Link href={tile.href} className="tile-overlay">
                    <span className="tile__sr">{tile.title}</span>
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
