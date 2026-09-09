"use client";

import Link from "next/link";
import { Compass, Layers, Mountain } from "lucide-react";
import {
  StatusPill,
  Divider,
  Empty,
  EventCard,
  EventMark,
  type EventTone,
  PageHeader,
  SectionTitle,
} from "@/design-system";
import type { ChapterOutline } from "@/features/study/types";

// White pill, coloured ink: a tinted pill vanishes whenever the card shares its hue.
const DIFFICULTY_INK = {
  beginner: "text-ok",
  intermediate: "text-warn",
  advanced: "text-bad",
} as const;

// The mark says how far in the topic is, so the card is readable before the pill.
const DIFFICULTY_MARK = {
  beginner: Compass,
  intermediate: Layers,
  advanced: Mountain,
} as const;

// Walked per card, not per chapter: neighbours should never share a fill.
const TONES: EventTone[] = ["info", "brand", "warn", "ok"];

export function SubjectView({
  subjectSlug,
  name,
  description,
  chapters,
}: {
  subjectSlug: string;
  name: string;
  description: string | null;
  chapters: ChapterOutline[];
}) {
  const topicCount = chapters.reduce((n, c) => n + c.topics.length, 0);

  return (
    <div>
      <nav className="text-ink-3 mb-6 text-[13px]">
        <Link href="/study" className="hover:text-ink transition-colors">
          Knowledge base
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-2">{name}</span>
      </nav>

      <PageHeader
        title={name}
        sub={
          description ??
          `${topicCount} topic${topicCount === 1 ? "" : "s"} across ${chapters.length} chapter${chapters.length === 1 ? "" : "s"}.`
        }
      />

      {topicCount === 0 ? (
        <Empty
          title="No published topics in this subject yet"
          sub="They will appear here once the pipeline imports and a reviewer publishes them."
        />
      ) : (
        <div className="space-y-10">
          {chapters
            .filter((c) => c.topics.length > 0)
            .map((chapter, i) => (
              <section key={chapter.slug}>
                <SectionTitle
                  aside={`${chapter.topics.length} topic${chapter.topics.length === 1 ? "" : "s"}`}
                >
                  {chapter.name}
                </SectionTitle>
                {/* Three up: a full-width row per topic is a scroll, not a scan. */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {chapter.topics.map((t, j) => {
                    const Mark = DIFFICULTY_MARK[t.difficulty];
                    return (
                      <Link
                        key={t.slug}
                        href={`/study/${subjectSlug}/${chapter.slug}/${t.slug}`}
                        className="block h-full"
                      >
                        <EventCard
                          kind={t.title}
                          when={`${t.estimatedMinutes} min`}
                          tone={TONES[(i + j) % TONES.length]}
                          className="h-full"
                          mark={
                            <EventMark disc>
                              <Mark strokeWidth={2} />
                            </EventMark>
                          }
                          footer={
                            <StatusPill
                              tone="live"
                              className={DIFFICULTY_INK[t.difficulty]}
                            >
                              {t.difficulty}
                            </StatusPill>
                          }
                        >
                          {t.summary}
                        </EventCard>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}

      <Divider className="mt-12" />
    </div>
  );
}
