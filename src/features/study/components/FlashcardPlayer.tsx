"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/design-system";
import type { Flashcard } from "../types";

const GRADES = [
  { key: "j", label: "Again" },
  { key: "k", label: "Hard" },
  { key: "l", label: "Good" },
  { key: ";", label: "Easy" },
];

export function FlashcardPlayer({
  topicSlug,
  onClose,
}: {
  topicSlug: string;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/study/topics/${topicSlug}/flashcards`)
      .then((r) => r.json())
      .then((d: { flashcards?: Flashcard[] }) => {
        if (live) setCards(d.flashcards ?? []);
      })
      .catch(() => live && setCards([]));
    return () => {
      live = false;
    };
  }, [topicSlug]);

  const advance = useCallback(() => {
    setShown(false);
    setI((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Capture phase + stopImmediatePropagation so this closes the player
        // rather than the running head walking a level up the URL.
        e.stopImmediatePropagation();
        e.preventDefault();
        onClose();
        return;
      }
      if (!cards) return;
      if (e.key === " ") {
        e.preventDefault();
        setShown(true);
        return;
      }
      if (shown && GRADES.some((g) => g.key === e.key)) advance();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [cards, shown, advance, onClose]);

  const done = cards ? i >= cards.length : false;
  const card = cards && !done ? cards[i] : null;

  return (
    <div className="bg-canvas fixed inset-0 z-90 flex flex-col">
      <header className="border-line flex h-16 shrink-0 items-center gap-3 border-b px-6">
        <span className="text-[14px]">Flashcards</span>
        <span className="tnum text-ink-3 text-[13px]">
          {cards && !done ? `${i + 1} of ${cards.length}` : ""}
        </span>
        <span className="flex-1" />
        <button
          onClick={onClose}
          aria-label="Close flashcards"
          className="rounded-ctl text-ink-3 hover:bg-line hover:text-ink grid size-8 place-items-center transition-colors"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6">
        {cards === null ? (
          <p className="text-ink-3 text-center text-[14px]">Loading…</p>
        ) : cards.length === 0 ? (
          <div className="text-center">
            <p className="text-[18px]">No flashcards for this topic yet</p>
            <p className="text-ink-3 mx-auto mt-2 max-w-[42ch] text-[14px] leading-relaxed">
              Cards are generated in the content pipeline and shown once
              reviewed and published.
            </p>
            <Button className="mt-6" variant="secondary" onClick={onClose}>
              Back to the topic
            </Button>
          </div>
        ) : done ? (
          <div className="text-center">
            <p className="text-[22px] tracking-[-0.02em]">Deck cleared</p>
            <p className="text-ink-3 mx-auto mt-3 max-w-[42ch] text-[14px] leading-relaxed">
              {cards.length} card{cards.length === 1 ? "" : "s"} reviewed.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button
                onClick={() => {
                  setI(0);
                  setShown(false);
                }}
              >
                Review again
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="card hover:bg-brand-soft/40 w-full p-10 text-left transition-colors"
              onClick={() => setShown(true)}
            >
              <p className="text-[22px] leading-snug tracking-[-0.02em]">
                {card!.front}
              </p>
              {shown ? (
                <>
                  <p className="border-line text-ink-2 mt-6 border-t pt-6 text-[16px] leading-relaxed">
                    {card!.back}
                  </p>
                  {card!.explanation ? (
                    <p className="text-ink-3 mt-3 text-[14px] leading-relaxed">
                      {card!.explanation}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-ink-4 mt-8 text-[13px]">
                  Click or press Space to reveal
                </p>
              )}
            </button>

            {shown ? (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {GRADES.map((g, n) => (
                  <button
                    key={g.key}
                    onClick={advance}
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
    </div>
  );
}
