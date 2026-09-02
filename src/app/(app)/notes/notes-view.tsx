"use client";

import { useState } from "react";
import { PageHeader, Empty, Segmented } from "@/design-system";
import {
  SECTION_KEY,
  SECTION_SHORT,
  SECTIONS,
  type Subject,
} from "@/data/navigation";

/* Notes. In this market notes are formulae, shortcuts and tricks — so they are
   filed by section and searchable, not a board of coloured squares. */

type Note = { id: number; section: Subject; title: string; body: string };

const SEED: Note[] = [
  {
    id: 1,
    section: SECTIONS[0],
    title: "Successive percentage change",
    body: "a + b + ab/100. For a 20% rise then 20% fall: 20 − 20 − 400/100 = −4%. Always a net loss.",
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
  },
];

export function NotesView() {
  const [notes, setNotes] = useState(SEED);
  const [section, setSection] = useState<Subject | "All">("All");
  const [q, setQ] = useState("");

  const shown = notes.filter(
    (n) =>
      (section === "All" || n.section === section) &&
      (q.trim() === "" ||
        (n.title + n.body).toLowerCase().includes(q.toLowerCase())),
  );

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
        <Segmented
          value={section}
          options={["All", ...SECTIONS] as const}
          onChange={(v) => setSection(v as Subject | "All")}
          labels={{ ...SECTION_SHORT, All: "All" }}
        />
        <span className="text-ink-3 text-[13px]">
          {shown.length} of {notes.length}
        </span>
      </div>

      {shown.length === 0 ? (
        <Empty
          title="Nothing matches"
          sub="Try a different section, or clear the search."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((n) => (
            <article
              key={n.id}
              className="card group hover:bg-brand-soft/40 flex flex-col p-5 transition-colors duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[13px]"
                  style={{ color: `var(--color-${SECTION_KEY[n.section]})` }}
                >
                  {SECTION_SHORT[n.section]}
                </span>
                <button
                  className="text-ink-4 hover:text-bad text-[13px] opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setNotes(notes.filter((x) => x.id !== n.id))}
                  aria-label={`Delete ${n.title}`}
                >
                  Delete
                </button>
              </div>
              <h3 className="mt-2.5 text-[15.5px] leading-snug">{n.title}</h3>
              <p className="text-ink-2 mt-2 text-[14px] leading-relaxed">
                {n.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
