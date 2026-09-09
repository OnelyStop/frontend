"use client";

import Link from "next/link";
import {
  StatusPill,
  Divider,
  Empty,
  PageHeader,
  PlanCard,
  SECTION_TINT,
  SectionTitle,
} from "@/design-system";
import type { ChapterOutline } from "@/features/study/types";

const DIFFICULTY_TONE = {
  beginner: "ok",
  intermediate: "warn",
  advanced: "bad",
} as const;

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
                  {chapter.topics.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/study/${subjectSlug}/${chapter.slug}/${t.slug}`}
                      className="block h-full"
                    >
                      <PlanCard
                        size="sm"
                        title={t.title}
                        className={`mb-0 h-full ${SECTION_TINT[i % SECTION_TINT.length]}`}
                        status={
                          <span className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={DIFFICULTY_TONE[t.difficulty]}>
                              {t.difficulty}
                            </StatusPill>
                            <StatusPill tone="neutral">
                              {t.estimatedMinutes} min
                            </StatusPill>
                          </span>
                        }
                      >
                        {t.summary}
                      </PlanCard>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      <Divider className="mt-12" />
    </div>
  );
}
