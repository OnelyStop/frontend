"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Badge,
  ButtonLink,
  Card,
  OptionRow,
  SectionTitle,
  Segmented,
  Table,
  Td,
  Th,
  Tr,
} from "@/design-system";
import { SECTION_FROM_DB, SECTION_KEY } from "@/data/navigation";
import { SURFACE } from "@/design-system/lib/motion";
import type { ScoredQuestion } from "../types";

const FILTERS = ["All", "Wrong", "Skipped", "Slow"] as const;
type Filter = (typeof FILTERS)[number];

// A question past this pace is "slow" for this review, independent of
// section — the app's own drills target 45s/question (drills-view.tsx), so
// twice that is a question worth flagging regardless of whether it was
// answered right.
const SLOW_MS = 90_000;

/** Every reviewed question, filterable, expanding to the full stem, your
 * pick against the correct one via the same `OptionRow` mocks/drills use,
 * the explanation when one exists, and a link to the topic's theory note —
 * the always-available half (100% topic coverage) that carries the ~35% of
 * questions with no explanation text yet. This table is also this
 * dashboard's required table-view twin for every chart above it. */
export function QuestionReview({ questions }: { questions: ScoredQuestion[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = questions.filter((q) => {
    if (filter === "Wrong") return q.chosen !== null && !q.isCorrect;
    if (filter === "Skipped") return q.chosen === null;
    if (filter === "Slow") return (q.timeMs ?? 0) > SLOW_MS;
    return true;
  });

  return (
    <Card pad={false} className="overflow-hidden">
      <div className="p-6 pb-0">
        <SectionTitle aside={`${shown.length} of ${questions.length}`}>
          Question by question
        </SectionTitle>
        <div className="mt-4">
          <Segmented value={filter} options={FILTERS} onChange={setFilter} />
        </div>
      </div>

      <div className="mt-4">
        <Table
          head={
            <>
              <Th>#</Th>
              <Th>Topic</Th>
              <Th>Your answer</Th>
              <Th>Correct</Th>
              <Th align="right">Time</Th>
              <Th align="right">Result</Th>
            </>
          }
        >
          {shown.map((q) => (
            <QuestionRow
              key={q.qId}
              question={q}
              open={openId === q.qId}
              onToggle={() => setOpenId(openId === q.qId ? null : q.qId)}
            />
          ))}
        </Table>
      </div>
    </Card>
  );
}

function QuestionRow({
  question: q,
  open,
  onToggle,
}: {
  question: ScoredQuestion;
  open: boolean;
  onToggle: () => void;
}) {
  const verdict =
    q.chosen === null ? "skipped" : q.isCorrect ? "correct" : "wrong";
  return (
    <>
      <Tr onClick={onToggle} active={open}>
        <Td className="tnum text-ink-3">{q.qNum ?? "—"}</Td>
        <Td>
          <p className="text-ink-2">
            {q.topic?.replace(/_/g, " ") ?? "Uncategorised"}
          </p>
          <p className="text-ink-4 text-[12px]">{q.section}</p>
        </Td>
        <Td className="tnum">{q.chosen?.toUpperCase() ?? "—"}</Td>
        <Td className="tnum">{q.correct.toUpperCase()}</Td>
        <Td align="right" className="tnum text-ink-3">
          {q.timeMs !== null ? `${Math.round(q.timeMs / 1000)}s` : "—"}
        </Td>
        <Td align="right">
          <Badge
            tone={
              verdict === "correct"
                ? "ok"
                : verdict === "wrong"
                  ? "bad"
                  : "neutral"
            }
          >
            {verdict === "correct"
              ? "✓ Correct"
              : verdict === "wrong"
                ? "✗ Wrong"
                : "– Skipped"}
          </Badge>
        </Td>
      </Tr>
      <AnimatePresence initial={false}>
        {open ? (
          <tr>
            <td colSpan={6} className="p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SURFACE}
                className="bg-panel/40 border-line border-b px-6 py-6"
              >
                {q.direction ? (
                  <p className="bg-canvas text-ink-2 ring-line mb-4 rounded-[14px] p-4 text-[14px] leading-relaxed ring-1">
                    {q.direction}
                  </p>
                ) : null}
                <p className="mb-4 text-[15px] leading-relaxed">{q.stem}</p>

                <div className="grid gap-2">
                  {q.options.map((o) => {
                    const isChosen =
                      q.chosen?.toLowerCase() === o.key.toLowerCase();
                    const isRight =
                      q.correct.toLowerCase() === o.key.toLowerCase();
                    return (
                      <div key={o.key} className="relative">
                        <OptionRow
                          label={o.key.toUpperCase()}
                          selected={isRight}
                          onSelect={() => {}}
                        >
                          {o.text}
                          {/* The indigo highlight alone used to be the only
                              signal that this is the right answer — colour is
                              never the only signal, per this app's own rule. */}
                          {isRight ? (
                            <span className="text-ok ml-2 text-[12px] font-medium">
                              Correct answer
                            </span>
                          ) : null}
                        </OptionRow>
                        {/* Always acknowledges the user's own pick, right or
                            wrong — previously only rendered on a wrong pick,
                            so a correct answer got no confirmation at all. */}
                        {isChosen ? (
                          <Badge
                            tone={isRight ? "ok" : "bad"}
                            className="absolute top-1/2 right-3 -translate-y-1/2"
                          >
                            Your pick
                          </Badge>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {q.explanation ? (
                  <p className="text-ink-2 border-line mt-5 border-t pt-4 text-[14px] leading-relaxed">
                    {q.explanation}
                  </p>
                ) : null}

                {q.noteId ? (
                  <div className="border-line bg-canvas mt-5 rounded-[14px] border p-4">
                    <p
                      className="text-[13px]"
                      style={
                        SECTION_FROM_DB[q.section]
                          ? {
                              color: `var(--color-${SECTION_KEY[SECTION_FROM_DB[q.section]!]})`,
                            }
                          : undefined
                      }
                    >
                      {q.section}
                    </p>
                    {q.noteSummary ? (
                      <p className="text-ink-2 mt-1.5 max-w-[62ch] text-[14px] leading-relaxed">
                        {q.noteSummary}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <ButtonLink
                        href={`/notes/${q.noteId}`}
                        variant="secondary"
                        size="sm"
                      >
                        Open {q.noteTitle} theory →
                      </ButtonLink>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </td>
          </tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}
