import { ButtonLink, Card, SectionTitle, tintFor } from "@/design-system";
import { SECTION_FROM_DB, SECTION_KEY } from "@/data/navigation";
import type { TopicTheory } from "../types";

/** Every subtopic is offered as a chip rather than the card picking one: a question carries only a topic, so the reader is the one who knows which subtopic applied. */
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
    // Filled by section, the same signal the label above it already carries — three revise cards in a row must not read as one block.
    <Card className={tintFor(t.section)}>
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
      <h3 className="mt-1.5 text-[20px] font-normal tracking-[-0.01em]">
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
