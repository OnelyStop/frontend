"use client";

import { Empty, Lattice, LatticeCell, PageHeader } from "@/design-system";
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
        <Lattice cols={3}>
          {subjects.map((s) => (
            <LatticeCell key={s.slug} href={`/study/${s.slug}`}>
              <p className="text-[19px] tracking-[-0.02em]">{s.name}</p>
              <p className="text-ink-2 mt-2 max-w-[36ch] text-[14px] leading-[1.55]">
                {s.description ?? BLURB[s.slug] ?? ""}
              </p>
              <span className="tnum text-ink-3 mt-8 block text-[13px]">
                {s.topicCount} topic{s.topicCount === 1 ? "" : "s"} ·{" "}
                {s.chapterCount} chapter{s.chapterCount === 1 ? "" : "s"}
              </span>
            </LatticeCell>
          ))}
        </Lattice>
      )}
    </div>
  );
}
