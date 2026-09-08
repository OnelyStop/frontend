"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Empty,
  Input,
  PageHeader,
  Segmented,
  StatusPill,
} from "@/design-system";
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
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className="card card-lift group relative block h-full p-5"
                  >
                    <span
                      aria-hidden
                      className="bg-panel text-ink-3 group-hover:bg-brand-soft group-hover:text-brand absolute top-4 right-4 grid size-8 place-items-center rounded-full transition-colors"
                    >
                      <ArrowUpRight size={16} strokeWidth={2} />
                    </span>

                    <p className="text-ink-3 max-w-[26ch] text-[12.5px]">
                      {n.subjectName}
                    </p>
                    <p className="mt-0.5 max-w-[24ch] text-[15px] font-semibold">
                      {n.topicTitle}
                    </p>

                    {n.selectedText ? (
                      <p className="border-brand text-ink-2 mt-3 line-clamp-2 border-l-2 pl-3 text-[13px] leading-relaxed">
                        {n.selectedText}
                      </p>
                    ) : null}

                    <p className="mt-3 line-clamp-4 text-[13.5px] leading-relaxed">
                      {n.bodyMarkdown}
                    </p>

                    <div className="mt-4">
                      <StatusPill tone="neutral">
                        {DATE.format(new Date(n.updatedAt))}
                      </StatusPill>
                    </div>
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
