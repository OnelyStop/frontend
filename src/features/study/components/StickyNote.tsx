"use client";

import type { NoteColor, StudyNote } from "../types";

/* One source of truth for the four note colours — the composer swatches, the
   chips under a block, and the dot on a saved card all read from here. */
export const NOTE_SWATCH: Record<NoteColor, string> = {
  yellow: "#facc15",
  blue: "#60a5fa",
  green: "#4ade80",
  pink: "#f472b6",
};

export const NOTE_COLORS = Object.keys(NOTE_SWATCH) as NoteColor[];

/* A stable small tilt per note, so a row of chips looks pinned by hand rather
   than printed. Deterministic in id so it never shifts between renders. */
function tiltOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 7) - 3) * 1.4; // -4.2° … +4.2°
}

function firstLine(md: string): string {
  const line = md.trim().split("\n")[0] ?? "";
  return line.length > 80 ? `${line.slice(0, 79)}…` : line || "Empty note";
}

/* The affordance that replaces the old "Add a note" text link. A folded sticky
   note with a +, resting with a slow nudge and peeling its corner on hover. */
export function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add a note here"
      title="Add a note here"
      className="group text-ink-4 hover:text-brand hover:bg-brand-soft/50 grid size-7 place-items-center rounded-[8px] transition-colors"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="size-[18px] motion-safe:animate-[note-nudge_2.8s_ease-in-out_infinite] motion-safe:group-hover:[animation:none]"
      >
        <path
          d="M3 3h14v9l-5 5H3z"
          fill="currentColor"
          className="opacity-15"
        />
        <path
          d="M3 3h14v9l-5 5H3z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* folded corner — lifts on hover */}
        <path
          d="M17 12l-5 5v-5z"
          fill="currentColor"
          className="origin-[12px_12px] transition-transform duration-200 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
        />
        <path
          d="M10 6.5v5M7.5 9h5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          className="transition-transform duration-200 group-hover:rotate-90"
          style={{ transformOrigin: "10px 9px" }}
        />
      </svg>
    </button>
  );
}

/* The saved notes for one block, shown as pinned chips beside the block so they
   are visible at a glance. Clicking one opens it in the note modal. */
export function BlockNoteChips({
  notes,
  onOpen,
}: {
  notes: StudyNote[];
  onOpen: (noteId: string) => void;
}) {
  if (notes.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {notes.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onOpen(n.id)}
            title={firstLine(n.bodyMarkdown)}
            aria-label={`Open note: ${firstLine(n.bodyMarkdown)}`}
            className="group shadow-pop relative block size-5 rounded-[4px] transition-transform duration-150 hover:-translate-y-0.5 hover:rotate-0"
            style={{
              background: NOTE_SWATCH[n.color],
              transform: `rotate(${tiltOf(n.id)}deg)`,
            }}
          >
            {/* folded corner */}
            <span
              aria-hidden
              className="absolute right-0 bottom-0 border-[5px] border-transparent border-r-white/45 border-b-white/45"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
