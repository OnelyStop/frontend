import { ButtonLink, Card, SectionTitle } from "@/design-system";
import { SECTION_FROM_DB, SECTION_KEY } from "@/data/navigation";
import type { TopicTheory } from "../types";

/**
 * The worst topics by marks lost, each with real theory to revise — the most
 * prominent thing between the score and the question-by-question detail,
 * since linking a wrong answer back to the theory that explains it is this
 * product's differentiator ("theory is way too subtle here, redesign is
 * needed coz this is a focal point").
 *
 * Reuses the app's own inline-theory language (Reader.tsx's 2px coloured
 * left-rule blocks, study/blocks.ts's "Shortcut"/"Common mistake" labels)
 * rather than inventing a new visual vocabulary for this one screen.
 *
 * Every subtopic under a topic is offered as a chip rather than the card
 * silently picking one — a question only carries a topic (Arithmetic alone
 * has 16 subtopics), so the reader is the one who knows which applied.
 */
export function TopicTheorySection({ theory }: { theory: TopicTheory[] }) {
  if (theory.length === 0) return null;

  return (
    <div className="mb-6">
      <SectionTitle>Revise these topics</SectionTitle>
      <div className="mt-4 grid gap-4">
        {theory.map((t) => (
          <TopicTheoryCard key={t.topic} theory={t} />
        ))}
      </div>
    </div>
  );
}

function TopicTheoryCard({ theory: t }: { theory: TopicTheory }) {
  const subject = SECTION_FROM_DB[t.section];

  return (
    <Card>
      <p
        className="text-[13px]"
        style={
          subject
            ? { color: `var(--color-${SECTION_KEY[subject]})` }
            : undefined
        }
      >
        {subject ?? t.section}
      </p>
      <h3 className="mt-1.5 text-[24px] font-normal tracking-[-0.01em]">
        {t.topicTitle}
      </h3>
      <p className="text-ink-2 mt-2 max-w-[62ch] text-[15px] leading-relaxed">
        {t.summary}
      </p>

      {(t.tricks.length > 0 || t.commonMistakes.length > 0) && (
        <div className="mt-5 grid gap-4">
          {t.tricks.map((trick) => (
            <div key={trick.name} className="border-ok border-l-2 pl-5">
              <p className="text-ink-3 text-[13px]">Shortcut</p>
              <p className="mt-1 text-[15px]">{trick.name}</p>
              <p className="text-ink-2 mt-1 text-[14px] leading-relaxed">
                {trick.description}
              </p>
            </div>
          ))}
          {t.commonMistakes.map((mistake) => (
            <div key={mistake} className="border-warn border-l-2 pl-5">
              <p className="text-ink-3 text-[13px]">Common mistake</p>
              <p className="text-ink-2 mt-1 text-[14px] leading-relaxed">
                {mistake}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="border-line mt-5 border-t pt-4">
        <p className="text-ink-3 mb-2.5 text-[13px]">
          {t.subtopics.length > 1
            ? "Which one was this about?"
            : "Read the full note"}
        </p>
        <div className="flex flex-wrap gap-2">
          {t.subtopics.map((s) => (
            <ButtonLink
              key={s.noteId}
              href={`/notes/${s.noteId}`}
              variant="secondary"
              size="sm"
            >
              {s.title}
            </ButtonLink>
          ))}
        </div>
      </div>
    </Card>
  );
}
