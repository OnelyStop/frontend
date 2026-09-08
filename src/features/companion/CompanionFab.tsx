"use client";

import { useCompanion } from "./CompanionContext";
import { CompanionMascot } from "./CompanionMascot";

// Floating button that opens Ask Onely, seeded with a passage (here, the topic).
export function CompanionFab({
  seed,
  label = "Ask Onely",
}: {
  seed: string;
  label?: string;
}) {
  const { open, openWith } = useCompanion();

  return (
    <div
      className={`fixed right-5 bottom-5 z-80 transition-all duration-200 ${
        open
          ? "pointer-events-none translate-y-2 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={() => openWith(seed)}
        aria-label={label}
        title={label}
        className="group border-line bg-canvas shadow-pop hover:border-line-2 relative grid size-14 place-items-center rounded-full border transition-[transform,border-color] duration-200 hover:scale-105 focus-visible:scale-105"
      >
        <CompanionMascot />
        <span className="border-line bg-canvas text-ink-2 shadow-pop pointer-events-none absolute right-16 rounded-full border px-3 py-1 text-[12px] whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      </button>
    </div>
  );
}
