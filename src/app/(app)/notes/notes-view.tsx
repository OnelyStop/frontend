"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Empty, Input, NoteCard, PageHeader, Segmented } from "@/design-system";
import type { OwnNote } from "@/features/study/types";

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export function NotesView({ notes }: { notes: OwnNote[] }) {
  const [subject, setSubject] = useState<string>("All");
  const [q, setQ] = useState("");

  const subjects = useMemo(
    () => Array.from(new Set(notes.map((n) => n.subjectName))).sort(),
    [notes],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return notes.filter((n) => {
      if (subject !== "All" && n.subjectName !== subject) return false;
      if (!needle) return true;
      return (
        n.bodyMarkdown.toLowerCase().includes(needle) ||
        n.topicTitle.toLowerCase().includes(needle) ||
        (n.selectedText ?? "").toLowerCase().includes(needle)
      );
    });
  }, [notes, subject, q]);

  return (
    <div>
      <PageHeader
        title="Notes"
        sub="Everything you have written while reading. Each one opens the passage it came from."
        actions={
          notes.length > 0 ? (
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your notes"
              aria-label="Search your notes"
            />
          ) : undefined
        }
      />

      {notes.length === 0 ? (
        <Empty
          mark="✎"
          tone="brand"
          title="No notes yet"
          sub="Select any passage in the knowledge base and write a note on it. Every note you keep lands here, with a way back to where you wrote it."
        />
      ) : (
        <>
          {subjects.length > 1 ? (
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <Segmented
                value={subject}
                options={["All", ...subjects]}
                onChange={setSubject}
              />
              <span className="text-ink-3 text-[13px]">
                {shown.length} of {notes.length}
              </span>
            </div>
          ) : null}

          {shown.length === 0 ? (
            <Empty
              mark="⌕"
              title="Nothing matches"
              sub="No note mentions that. Try a shorter word, or clear the filter."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="group block h-full">
                    <NoteCard
                      id={n.id}
                      tint={n.color}
                      source={`${n.subjectName} · ${n.topicTitle}`}
                      quote={n.selectedText}
                      when={DATE.format(new Date(n.updatedAt))}
                      action={
                        <span
                          aria-hidden
                          className="absolute top-4 right-4 grid size-7 place-items-center rounded-full bg-black/5 text-black/40 transition-colors group-hover:bg-black/10 group-hover:text-black/70"
                        >
                          <ArrowUpRight size={15} strokeWidth={2} />
                        </span>
                      }
                    >
                      {n.bodyMarkdown}
                    </NoteCard>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
