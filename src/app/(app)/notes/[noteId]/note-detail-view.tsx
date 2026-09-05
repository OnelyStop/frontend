import {
  ButtonLink,
  Badge,
  Card,
  Divider,
  SectionTitle,
} from "@/design-system";
import { SECTION_FROM_DB, SECTION_KEY, SECTION_LABEL } from "@/data/navigation";
import type { NoteDetail } from "@/features/notes/types";

export function NoteDetailView({ note }: { note: NoteDetail }) {
  const subject = SECTION_FROM_DB[note.section];

  return (
    <div data-companion className="max-w-[68ch]">
      <ButtonLink
        href="/notes"
        variant="ghost"
        size="sm"
        className="mb-8 -ml-3.5"
      >
        ← Notes
      </ButtonLink>

      <span
        className="text-[13px]"
        style={{ color: `var(--color-${SECTION_KEY[subject]})` }}
      >
        {SECTION_LABEL[subject]} · {note.topic.replaceAll("_", " ")}
        {note.subtopic ? ` · ${note.subtopic}` : ""}
      </span>
      <h1 className="mt-2.5 max-w-[24ch] text-[38px] leading-[1.08] tracking-[-0.03em]">
        {note.title}
      </h1>
      <p className="text-ink-2 mt-4 max-w-[52ch] text-[16px] leading-[1.55]">
        {note.summary}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {note.difficulty ? (
          <Badge tone="neutral">{note.difficulty}</Badge>
        ) : null}
        {note.examRelevance.exams.map((e) => (
          <Badge key={e} tone="brand">
            {e.replaceAll("_", " ")}
          </Badge>
        ))}
        {note.examRelevance.stage.map((s) => (
          <Badge key={s} tone="neutral">
            {s}
          </Badge>
        ))}
        {note.aliases.map((a) => (
          <Badge key={a} tone="neutral">
            aka {a}
          </Badge>
        ))}
      </div>

      <Divider className="my-10" />

      <Card className="mb-6">
        <SectionTitle>Concept</SectionTitle>
        <p className="text-ink-2 text-[15px] leading-[1.7] whitespace-pre-wrap">
          {note.concept}
        </p>
      </Card>

      {note.formulas.length > 0 ? (
        <Card className="mb-6">
          <SectionTitle>Formulas</SectionTitle>
          <div className="space-y-5">
            {note.formulas.map((f) => (
              <div key={f.name}>
                <p className="text-[14px]">{f.name}</p>
                <p className="tnum text-ink mt-1 text-[15px]">{f.expression}</p>
                {f.notes ? (
                  <p className="text-ink-3 mt-1 text-[13px] leading-relaxed">
                    {f.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {note.tricks.length > 0 ? (
        <Card className="mb-6">
          <SectionTitle>Tricks</SectionTitle>
          <div className="space-y-6">
            {note.tricks.map((t) => (
              <div key={t.name}>
                <p className="text-[14.5px]">{t.name}</p>
                <p className="text-ink-2 mt-1.5 text-[14px] leading-relaxed">
                  {t.description}
                </p>
                <p className="text-ink-3 mt-1.5 text-[13px] leading-relaxed">
                  When to use: {t.whenToUse}
                </p>
                {t.example ? (
                  <p className="text-ink-3 mt-1.5 text-[13px] leading-relaxed">
                    e.g. {t.example}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {note.commonMistakes.length > 0 ? (
        <Card className="mb-6">
          <SectionTitle>Common mistakes</SectionTitle>
          <ul className="space-y-2.5">
            {note.commonMistakes.map((m) => (
              <li key={m} className="text-ink-2 text-[14px] leading-relaxed">
                {m}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {note.workedExamples.length > 0 ? (
        <Card className="mb-6">
          <SectionTitle>Worked examples</SectionTitle>
          <div className="space-y-8">
            {note.workedExamples.map((w, i) => (
              <div key={i}>
                <p className="text-[14.5px] leading-relaxed">{w.problem}</p>
                <ol className="border-line mt-3 space-y-1.5 border-l pl-4">
                  {w.steps.map((step, j) => (
                    <li
                      key={j}
                      className="text-ink-2 text-[13.5px] leading-relaxed"
                    >
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-[14px]">
                  <span className="text-ink-3">Answer — </span>
                  {w.answer}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {note.relatedQuestionIds.length > 0 ? (
        <Card className="mb-6">
          <SectionTitle>Practice from this topic</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {note.relatedQuestionIds.map((id) => (
              <Badge key={id} tone="neutral">
                {id}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
