"use client";

import { TutorMascot } from "./TutorMascot";

/* The always-on entry to the tutor: a floating button pinned to the bottom
   corner. Hidden while any panel is open (the chat card sits in the same
   spot). Only rendered for signed-in viewers — the chat needs an account. */
export function TutorFab({
  onClick,
  hidden,
}: {
  onClick: () => void;
  hidden: boolean;
}) {
  return (
    <div
      className={`fixed right-5 bottom-5 z-80 transition-all duration-200 ${
        hidden
          ? "pointer-events-none translate-y-2 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Ask the tutor"
        title="Ask the tutor"
        className="group border-line bg-canvas shadow-pop hover:border-line-2 relative grid size-14 place-items-center rounded-full border transition-[transform,border-color] duration-200 hover:scale-105 focus-visible:scale-105"
      >
        <TutorMascot />
        <span className="border-line bg-canvas text-ink-2 shadow-pop pointer-events-none absolute right-16 rounded-full border px-3 py-1 text-[12px] whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Ask the tutor
        </span>
      </button>
    </div>
  );
}
