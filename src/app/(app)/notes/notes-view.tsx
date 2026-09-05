"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { Dropdown, Empty, PageHeader, cn } from "@/design-system";
import {
  SECTION_KEY,
  SECTION_SHORT,
  SECTIONS,
  type Subject,
} from "@/data/navigation";

type Note = {
  id: number;
  section: Subject;
  title: string;
  body: string;
  pinned?: boolean;
};

const SEED: Note[] = [
  {
    id: 1,
    section: SECTIONS[0],
    title: "Successive percentage change",
    body: "a + b + ab/100. For a 20% rise then 20% fall: 20 − 20 − 400/100 = −4%. Always a net loss.",
    pinned: true,
  },
  {
    id: 2,
    section: SECTIONS[0],
    title: "Pipes and cisterns shortcut",
    body: "Take LCM of the times as total work. Two pipes 12 and 18 → LCM 36, rates 3 and 2, together 36/5 = 7.2 hrs.",
  },
  {
    id: 3,
    section: SECTIONS[1],
    title: "Syllogism — possibility cases",
    body: "'Some A are B' never guarantees 'Some B are not A'. Check possibility only when the option says 'may be true'.",
  },
  {
    id: 4,
    section: SECTIONS[0],
    title: "Boats and streams",
    body: "Downstream = u + v, upstream = u − v. Speed in still water = (D + U)/2, stream = (D − U)/2.",
  },
  {
    id: 5,
    section: SECTIONS[2],
    title: "Subject–verb: 'one of the'",
    body: "'One of the boys who play' — the verb after 'who' agrees with 'boys', not 'one'. Common trap in error spotting.",
  },
  {
    id: 6,
    section: SECTIONS[3],
    title: "Bank nationalisation dates",
    body: "14 banks in July 1969, 6 more in April 1980. New Bank of India merged with PNB in 1993.",
    pinned: true,
  },
];

const FILTERS = [
  { value: "All", label: "All sections" },
  ...SECTIONS.map((s) => ({ value: s, label: s, hint: SECTION_SHORT[s] })),
] as const;

export function NotesView() {
  const [notes, setNotes] = useState(SEED);
  const [section, setSection] = useState<Subject | "All">("All");
  const [q, setQ] = useState("");

  const shown = notes
    .filter(
      (n) =>
        (section === "All" || n.section === section) &&
        (q.trim() === "" ||
          (n.title + n.body).toLowerCase().includes(q.toLowerCase())),
    )
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const togglePin = (id: number) =>
    setNotes((all) =>
      all.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );

  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <div data-companion>
      <PageHeader
        title="Notes"
        sub="Formulae, shortcuts and the traps you keep falling for — filed by section so you can find one mid-drill."
        actions={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            className="rounded-ctl border-line bg-canvas placeholder:text-ink-4 focus:border-brand h-9 w-60 border px-3.5 text-[13px] transition-colors outline-none"
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Dropdown
          value={section}
          options={FILTERS}
          onChange={(v) => setSection(v as Subject | "All")}
          className="w-56"
        />
        <span className="text-ink-3 text-[13px]">
          {shown.length} of {notes.length}
          {pinnedCount ? ` · ${pinnedCount} pinned` : ""}
        </span>
      </div>

      {shown.length === 0 ? (
        <Empty
          title="Nothing matches"
          sub="Try a different section, or clear the search."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((n) => (
            <NoteSheet
              key={n.id}
              note={n}
              onPin={() => togglePin(n.id)}
              onDelete={() => setNotes(notes.filter((x) => x.id !== n.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteSheet({
  note,
  onPin,
  onDelete,
}: {
  note: Note;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={cn(
        "card group relative flex flex-col overflow-hidden pt-5 transition-shadow",
        note.pinned && "shadow-pop",
      )}
    >
      <span aria-hidden className="bg-bad/25 absolute inset-y-0 left-11 w-px" />
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-4 grid w-3 content-start gap-6 pt-6"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="bg-line-2 block size-2 rounded-full" />
        ))}
      </span>

      <header className="flex items-start justify-between gap-3 pr-5 pl-14">
        <span
          className="text-[13px]"
          style={{ color: `var(--color-${SECTION_KEY[note.section]})` }}
        >
          {SECTION_SHORT[note.section]}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onPin}
            aria-pressed={Boolean(note.pinned)}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            title={note.pinned ? "Unpin" : "Pin to top"}
            className={cn(
              "rounded-pill grid size-7 place-items-center transition-all",
              note.pinned
                ? "text-brand"
                : "text-ink-4 hover:text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          >
            <Pin
              size={14}
              strokeWidth={2}
              className={note.pinned ? "-rotate-45 fill-current" : ""}
            />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${note.title}`}
            className="text-ink-4 hover:text-bad rounded-pill px-1.5 text-[13px] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            Delete
          </button>
        </div>
      </header>

      <h3 className="mt-2 pr-5 pl-14 text-[15.5px] leading-snug">
        {note.title}
      </h3>

      {/* ruled sets its own 32px line-height, so the body sits on the lines. */}
      <p className="ruled text-ink-2 mt-3 grow pr-5 pb-5 pl-14 text-[14px]">
        {note.body}
      </p>
    </article>
  );
}
