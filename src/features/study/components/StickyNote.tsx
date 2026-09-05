"use client";

import type { NoteColor, StudyNote } from "../types";

// The one source for the four note colours; swatches, chips and cards all read here.
export const NOTE_SWATCH: Record<NoteColor, string> = {
  yellow: "#facc15",
  blue: "#60a5fa",
  green: "#4ade80",
  pink: "#f472b6",
};

export const NOTE_COLORS = Object.keys(NOTE_SWATCH) as NoteColor[];

// Tilt is derived from the id so it never shifts between renders.
function tiltOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 7) - 3) * 1.4; // -4.2° … +4.2°
}

function firstLine(md: string): string {
  const line = md.trim().split("\n")[0] ?? "";
  return line.length > 80 ? `${line.slice(0, 79)}…` : line || "Empty note";
}

export function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add a note here"
      title="Add a note here"
      className="group text-ink-4 hover:text-brand hover:bg-brand-soft/50 grid size-7 place-items-center rounded-lg transition-colors"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="size-4.5 motion-safe:animate-[note-nudge_2.8s_ease-in-out_infinite] motion-safe:group-hover:animate-none"
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
        <path
          d="M17 12l-5 5v-5z"
          fill="currentColor"
          className="origin-[12px_12px] transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px"
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
            className="group shadow-pop relative block size-5 rounded-sm transition-transform duration-150 hover:-translate-y-0.5 hover:rotate-0"
            style={{
              background: NOTE_SWATCH[n.color],
              transform: `rotate(${tiltOf(n.id)}deg)`,
            }}
          >
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
