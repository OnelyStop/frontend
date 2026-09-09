import Link from "next/link";
import { Lock } from "lucide-react";
import { StatusPill, ButtonLink } from "@/design-system";
import type { TopicPreview } from "../types";

const DIFFICULTY_TONE = {
  beginner: "ok",
  intermediate: "warn",
  advanced: "bad",
} as const;

// What a signed-out visitor sees: the syllabus, not the lesson.
export function TopicPreviewView({ topic }: { topic: TopicPreview }) {
  const base = `/study/${topic.subject.slug}/${topic.chapter.slug}`;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
      <div className="min-w-0">
        <nav className="text-ink-3 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <Link href="/study" className="hover:text-ink transition-colors">
            Knowledge base
          </Link>
          <span>/</span>
          <Link
            href={`/study/${topic.subject.slug}`}
            className="hover:text-ink transition-colors"
          >
            {topic.subject.name}
          </Link>
          <span>/</span>
          <span className="text-ink-2">{topic.chapter.name}</span>
        </nav>

        <h1 className="text-[34px] leading-[1.1] tracking-[-0.03em]">
          {topic.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <StatusPill tone={DIFFICULTY_TONE[topic.difficulty]}>
            {topic.difficulty}
          </StatusPill>
          <span className="tnum text-ink-3 text-[13px]">
            {topic.estimatedMinutes} min read
          </span>
        </div>
        <p className="text-ink-2 mt-4 max-w-[68ch] text-[15.5px] leading-[1.6]">
          {topic.summary}
        </p>

        {topic.learningObjectives.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[16px] tracking-[-0.02em]">
              What you will be able to do
            </h2>
            <ul className="mt-3 max-w-[68ch] space-y-2">
              {topic.learningObjectives.map((objective) => (
                <li
                  key={objective}
                  className="text-ink-2 border-line border-l-2 pl-3 text-[14.5px] leading-relaxed"
                >
                  {objective}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {topic.sectionTitles.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[16px] tracking-[-0.02em]">
              What is inside this lesson
            </h2>
            <ol className="border-line mt-3 max-w-[68ch] border-t">
              {topic.sectionTitles.map((title, i) => (
                <li
                  key={title}
                  className="border-line text-ink-2 flex items-baseline gap-3 border-b py-2.5 text-[14.5px]"
                >
                  <span className="tnum text-ink-4 w-5 shrink-0 text-[12.5px]">
                    {i + 1}
                  </span>
                  {title}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="border-line rounded-card mt-10 max-w-[68ch] border p-6">
          <div className="text-ink-3 flex items-center gap-2 text-[13px]">
            <Lock size={14} strokeWidth={1.75} />
            The lesson itself is for members
          </div>
          <p className="text-ink-2 mt-2 text-[14.5px] leading-relaxed">
            Reading the {topic.sectionTitles.length} sections above, the worked
            examples and the practice set is free — the whole knowledge base is
            on the free plan, along with flashcards, private notes and Ask
            Onely.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/signup" size="sm">
              Create a free account
            </ButtonLink>
            <ButtonLink href="/login" size="sm" variant="secondary">
              Sign in
            </ButtonLink>
          </div>
        </section>
      </div>

      <aside className="mt-12 lg:mt-0">
        <p className="text-ink-3 mb-3 text-[12px]">{topic.chapter.name}</p>
        <nav className="space-y-0.5">
          {topic.siblings.map((sibling) => (
            <Link
              key={sibling.slug}
              href={`${base}/${sibling.slug}`}
              className={`rounded-ctl block px-2.5 py-1.5 text-[13px] leading-snug transition-colors ${
                sibling.slug === topic.slug
                  ? "bg-brand-soft text-ink"
                  : "text-ink-3 hover:bg-brand-soft/50 hover:text-ink"
              }`}
            >
              {sibling.title}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
