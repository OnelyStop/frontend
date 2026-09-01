"use client";

import {
  Badge,
  Empty,
  Lattice,
  LatticeCell,
  PageHeader,
} from "@/design-system";
import type { SubjectSummary } from "@/features/study/types";

export function StudyBrowseView({
  subjects,
  preview,
}: {
  subjects: SubjectSummary[];
  preview: boolean;
}) {
  return (
    <div>
      <PageHeader
        title="Knowledge base"
        sub="Structured lessons for every section. Pick a subject, then a chapter, then a topic — read, keep private notes, revise with flashcards and ask the tutor about what you are reading."
        actions={
          preview ? (
            <Badge tone="warn">Preview — includes unpublished</Badge>
          ) : null
        }
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
              {s.description ? (
                <p className="text-ink-2 mt-2 max-w-[34ch] text-[14px] leading-[1.55]">
                  {s.description}
                </p>
              ) : null}
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
