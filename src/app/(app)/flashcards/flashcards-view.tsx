"use client";

import { useEffect, useState } from "react";
import { Button, Card, PageHeader } from "@/design-system";

type Item = { q: string; a: string; date?: string };

type Deck = {
  id: string;
  name: string;
  blurb: string;
  /* Current affairs decays and is dated; a formula is not. Only decks that go
     stale print a date on the card. */
  dated: boolean;
  cards: Item[];
};

const DECKS: Deck[] = [
  {
    id: "ca",
    name: "Current affairs",
    blurb: "The last 60 days — the window GA actually asks from",
    dated: true,
    cards: [
      {
        q: "What is the current repo rate set by the RBI?",
        a: "6.50% — held at the February 2026 MPC meeting, the seventh consecutive pause.",
        date: "12 Aug",
      },
      {
        q: "Who is the current Governor of the Reserve Bank of India?",
        a: "Sanjay Malhotra, appointed December 2024 as the 26th Governor.",
        date: "12 Aug",
      },
      {
        q: "What is India's current account deficit projection for FY26?",
        a: "Around 1% of GDP, per the RBI's latest projection.",
        date: "15 Aug",
      },
    ],
  },
  {
    id: "banking",
    name: "Banking awareness",
    blurb: "Regulation, instruments and the machinery behind them",
    dated: false,
    cards: [
      {
        q: "What does CRAR stand for, and what is the Basel III minimum in India?",
        a: "Capital to Risk-weighted Assets Ratio. Basel III requires a minimum of 9% for Indian scheduled commercial banks.",
      },
      {
        q: "Which scheme insures bank deposits, and up to what limit?",
        a: "DICGC insurance covers deposits up to ₹5 lakh per depositor per bank.",
      },
      {
        q: "What is NEFT's settlement basis?",
        a: "Half-hourly batches, available 24×7 since December 2019. RTGS settles in real time and gross, above ₹2 lakh.",
      },
      {
        q: "What is SLR, and its current level?",
        a: "Statutory Liquidity Ratio — 18% of net demand and time liabilities, held in cash, gold or approved securities.",
      },
    ],
  },
  {
    id: "static",
    name: "Static GK",
    blurb: "Headquarters, dates and bodies that never move",
    dated: false,
    cards: [
      {
        q: "Which body regulates Indian insurance, and from where?",
        a: "IRDAI — Insurance Regulatory and Development Authority of India, headquartered in Hyderabad.",
      },
      {
        q: "When were Indian banks nationalised?",
        a: "14 banks in July 1969, 6 more in April 1980. New Bank of India merged into PNB in 1993.",
      },
      {
        q: "Where is the Asian Development Bank headquartered?",
        a: "Manila, Philippines. Founded in 1966.",
      },
    ],
  },
  {
    id: "formulae",
    name: "Quant formulae",
    blurb: "The dozen identities that carry most of the section",
    dated: false,
    cards: [
      {
        q: "Successive percentage change of a% then b%?",
        a: "a + b + ab/100. A 20% rise then a 20% fall gives −4% — always a net loss.",
      },
      {
        q: "Boats and streams: still-water and stream speed?",
        a: "Still water = (D + U)/2, stream = (D − U)/2, where D is downstream and U upstream speed.",
      },
      {
        q: "Pipes and cisterns shortcut?",
        a: "Take the LCM of the times as total work. Pipes of 12 and 18 → LCM 36, rates 3 and 2, together 36/5 = 7.2 hrs.",
      },
    ],
  },
  {
    id: "vocab",
    name: "English vocabulary",
    blurb: "Words that keep reappearing in cloze and fillers",
    dated: false,
    cards: [
      {
        q: "Mitigate",
        a: "To make less severe. Often confused with 'militate', which means to have a strong effect against something.",
      },
      {
        q: "Ostensible",
        a: "Stated or appearing to be true, but not necessarily so. The ostensible reason is rarely the real one.",
      },
      {
        q: "Precipitate (verb)",
        a: "To cause something to happen suddenly or too soon. As an adjective, hasty.",
      },
    ],
  },
];

const GRADES = [
  { key: "j", label: "Again" },
  { key: "k", label: "Hard" },
  { key: "l", label: "Good" },
  { key: ";", label: "Easy" },
];

export function FlashcardsView() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  const done = deck ? i >= deck.cards.length : false;
  const card = deck && !done ? deck.cards[i] : null;

  useEffect(() => {
    if (!deck || done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setShown(true);
        return;
      }
      if (shown && GRADES.some((g) => g.key === e.key)) {
        setShown(false);
        setI((n) => n + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const open = (d: Deck) => {
    setDeck(d);
    setI(0);
    setShown(false);
  };

  const grade = () => {
    setShown(false);
    setI((n) => n + 1);
  };

  if (!deck) {
    const total = DECKS.reduce((n, d) => n + d.cards.length, 0);
    return (
      <div>
        <PageHeader
          title="Flashcards"
          sub={`${total} cards due across five decks. Reveal with Space and grade with j / k / l / ; — whatever you miss comes back sooner.`}
        />

        <div className="border-line grid grid-cols-1 border-t border-l md:grid-cols-2 xl:grid-cols-3">
          {DECKS.map((d) => (
            <button
              key={d.id}
              onClick={() => open(d)}
              className="border-line hover:bg-brand-soft/40 relative flex flex-col items-start border-r border-b p-7 text-left transition-colors duration-200"
            >
              <p className="text-[19px] tracking-[-0.02em]">{d.name}</p>
              <p className="text-ink-2 mt-2 max-w-[34ch] text-[14px] leading-[1.55]">
                {d.blurb}
              </p>
              <span className="tnum text-ink-3 mt-8 text-[13px]">
                {d.cards.length} due{d.dated ? " · dated" : ""}
              </span>
              <span
                aria-hidden
                className="bg-ink-4 absolute right-[-2.5px] bottom-[-2.5px] size-[5px] rounded-full"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={deck.name}
        sub={deck.blurb}
        actions={
          <>
            <span className="tnum text-ink-3 mr-1 text-[14px]">
              {done ? "done" : `${i + 1} of ${deck.cards.length}`}
            </span>
            <Button variant="secondary" onClick={() => setDeck(null)}>
              All decks
            </Button>
          </>
        }
      />

      {done ? (
        <Card className="max-w-2xl p-12 text-center">
          <p className="text-[22px] tracking-[-0.02em]">Deck cleared</p>
          <p className="text-ink-3 mx-auto mt-3 max-w-[42ch] text-[14px] leading-relaxed">
            {deck.cards.length} cards reviewed. The ones you graded Again come
            back first tomorrow.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => open(deck)}>Review again</Button>
            <Button variant="secondary" onClick={() => setDeck(null)}>
              All decks
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* The stack visibly thins — that is the whole progress indicator. */}
          <div className="relative max-w-2xl">
            <div className="rounded-t-card border-line absolute inset-x-6 -top-3 h-6 border" />
            <div className="rounded-t-card border-line bg-canvas absolute inset-x-3 -top-1.5 h-6 border" />
            <button
              className="card hover:bg-brand-soft/40 relative w-full p-10 text-left transition-colors duration-200"
              onClick={() => setShown(true)}
            >
              {deck.dated && card!.date ? (
                <span className="tnum text-ink-4 text-[13px]">
                  {card!.date}
                </span>
              ) : null}
              <p
                className={`text-[24px] leading-snug tracking-[-0.02em] ${
                  deck.dated && card!.date ? "mt-4" : ""
                }`}
              >
                {card!.q}
              </p>
              {shown ? (
                <p className="border-line text-ink-2 mt-6 border-t pt-6 text-[16px] leading-relaxed">
                  {card!.a}
                </p>
              ) : (
                <p className="text-ink-4 mt-8 text-[13px]">
                  Click or press Space to reveal
                </p>
              )}
            </button>
          </div>

          {shown ? (
            <div className="mt-6 flex max-w-2xl flex-wrap gap-2.5">
              {GRADES.map((g, n) => (
                <button
                  key={g.key}
                  onClick={grade}
                  className={`rounded-pill inline-flex h-10 items-center gap-2 px-5 text-[14px] transition-colors ${
                    n < 2
                      ? "border-line-2 hover:border-ink/25 border"
                      : "bg-ink hover:bg-ink/85 text-white"
                  }`}
                >
                  {g.label}
                  <kbd className="text-[12px] opacity-50">{g.key}</kbd>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
