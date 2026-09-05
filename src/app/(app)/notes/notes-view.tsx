"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Badge,
  Empty,
  Input,
  Lattice,
  LatticeCell,
  PageHeader,
  Segmented,
} from "@/design-system";
import {
  SECTION_FROM_DB,
  SECTION_KEY,
  SECTION_LABEL,
  SECTIONS,
  type Subject,
} from "@/data/navigation";
import type { NoteSummary } from "@/features/notes/types";

/* Notes. In this market notes are formulae, shortcuts and tricks — so they are
   filed by section and searchable, not a board of coloured squares. */

export function NotesView({ notes }: { notes: NoteSummary[] }) {
  const [section, setSection] = useState<Subject | "All">("All");
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleTopic = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return notes.filter((n) => {
      const subject = SECTION_FROM_DB[n.section];
      if (section !== "All" && subject !== section) return false;
      if (!query) return true;
      const haystack = [n.title, n.summary, n.subtopic ?? "", ...n.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [notes, section, q]);

  // `shown` already arrives pre-sorted by topicOrder/subtopicOrder from listNotes(), so this
  // only needs to (a) stable-sort by canonical section index for the "All" tab, and (b)
  // bucket consecutive same-topic rows in one pass — no re-sort of subtopics needed.
  const grouped = useMemo(() => {
    const bySection = [...shown].sort(
      (a, b) =>
        SECTIONS.indexOf(SECTION_FROM_DB[a.section]) -
        SECTIONS.indexOf(SECTION_FROM_DB[b.section]),
    );
    const groups: { key: string; topicTitle: string; items: NoteSummary[] }[] =
      [];
    for (const n of bySection) {
      const key = `${n.section}::${n.topic}`;
      const last = groups.at(-1);
      if (last?.key === key) last.items.push(n);
      else groups.push({ key, topicTitle: n.topicTitle, items: [n] });
    }
    return groups;
  }, [shown]);

  return (
    <div data-companion>
      <PageHeader
        title="Notes"
        sub="Formulae, shortcuts and the traps you keep falling for — filed by section so you can find one mid-drill."
        actions={
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            className="w-60"
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Segmented
          value={section}
          options={["All", ...SECTIONS] as const}
          onChange={(v) => setSection(v as Subject | "All")}
          labels={{ ...SECTION_LABEL, All: "All" }}
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
        grouped.map((g, i) => {
          const isOpen = !collapsed.has(g.key);
          return (
            <div
              key={g.key}
              className={`mb-10 ${i > 0 ? "border-line border-t pt-8" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggleTopic(g.key)}
                aria-expanded={isOpen}
                className="mb-6 flex w-full items-baseline justify-between gap-4 text-left"
              >
                <span className="text-ink flex items-center gap-2 text-[16px] font-medium tracking-[-0.01em]">
                  <ChevronDown
                    size={15}
                    className={`text-ink-4 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                  />
                  {g.topicTitle}
                </span>
                <span className="text-ink-3 text-[13px]">{g.items.length}</span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <Lattice cols={3} as="ul">
                    {g.items.map((n) => {
                      const subject = SECTION_FROM_DB[n.section];
                      return (
                        <LatticeCell
                          key={n.noteId}
                          as="li"
                          href={`/notes/${encodeURIComponent(n.noteId)}`}
                          className="hover:shadow-pop transition-all duration-200 hover:z-10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] active:shadow-none"
                        >
                          <span
                            className="text-[13px]"
                            style={{
                              color: `var(--color-${SECTION_KEY[subject]})`,
                            }}
                          >
                            {SECTION_LABEL[subject]}
                            {n.subtopic ? ` · ${n.subtopic}` : ""}
                          </span>
                          <h3 className="mt-2.5 text-[15.5px] leading-snug">
                            {n.title}
                          </h3>
                          <p className="text-ink-2 mt-2 text-[14px] leading-relaxed">
                            {n.summary}
                          </p>
                          {n.difficulty ? (
                            <Badge tone="neutral" className="mt-3">
                              {n.difficulty}
                            </Badge>
                          ) : null}
                        </LatticeCell>
                      );
                    })}
                  </Lattice>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
