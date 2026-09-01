"use client";

import Link from "next/link";
import {
  Badge,
  Divider,
  Empty,
  PageHeader,
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
            .map((chapter) => (
              <section key={chapter.slug}>
                <SectionTitle
                  aside={`${chapter.topics.length} topic${chapter.topics.length === 1 ? "" : "s"}`}
                >
                  {chapter.name}
                </SectionTitle>
                <div className="border-line border-t border-l">
                  {chapter.topics.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/study/${subjectSlug}/${chapter.slug}/${t.slug}`}
                      className="border-line hover:bg-brand-soft/40 flex items-start gap-4 border-r border-b p-5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15.5px]">{t.title}</p>
                        <p className="text-ink-3 mt-1 max-w-[70ch] text-[13.5px] leading-relaxed">
                          {t.summary}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone={DIFFICULTY_TONE[t.difficulty]}>
                          {t.difficulty}
                        </Badge>
                        <span className="tnum text-ink-4 text-[13px]">
                          {t.estimatedMinutes} min
                        </span>
                      </div>
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
