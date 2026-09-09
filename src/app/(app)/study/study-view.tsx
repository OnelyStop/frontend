"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import {
  CornerBadge,
  Empty,
  IndexCard,
  PageHeader,
  StatusPill,
  tintFor,
} from "@/design-system";
import type { SubjectSummary } from "@/features/study/types";

const BLURB: Record<string, string> = {
  "quantitative-aptitude":
    "Arithmetic, interest, work and motion — the calculation core of every prelims and mains paper.",
  english:
    "Grammar foundations and the exam question types: error detection, sentence improvement, reading comprehension.",
  "banking-awareness":
    "The Indian financial system, the RBI, deposits and instruments, and the payment rails — evergreen, not current affairs.",
  "computer-awareness":
    "Functional units, memory, operating systems, databases, networks and cyber-security basics, kept vendor-neutral.",
  "reasoning-ability":
    "Coding, blood relations, directions, ranking, seating arrangements and syllogisms — plus series, statements and analytical puzzles.",
  "exam-guidance":
    "How to read a notification, handle negative marking, manage sectional time, and analyse a mock.",
};

export function StudyBrowseView({ subjects }: { subjects: SubjectSummary[] }) {
  return (
    <div>
      <PageHeader
        title="Knowledge base"
        sub="Structured lessons for every section. Pick a subject, then a chapter, then a topic — read, keep private notes, revise with flashcards and ask Onely about any passage you select."
      />

      {subjects.length === 0 ? (
        <Empty
          title="No subjects yet"
          sub="Content is imported from the study pipeline. Run the importer, or check back once the launch topics are published."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => (
            <Link
              key={s.slug}
              href={`/study/${s.slug}`}
              className="block h-full"
            >
              <IndexCard
                className={tintFor(s.slug)}
                title={s.name}
                badge={
                  <CornerBadge tone="quiet">
                    <BookOpen size={20} />
                  </CornerBadge>
                }
                footer={
                  <StatusPill tone="soon">
                    {s.topicCount} topic{s.topicCount === 1 ? "" : "s"} ·{" "}
                    {s.chapterCount} chapter{s.chapterCount === 1 ? "" : "s"}
                  </StatusPill>
                }
              >
                {s.description ?? BLURB[s.slug] ?? ""}
              </IndexCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
