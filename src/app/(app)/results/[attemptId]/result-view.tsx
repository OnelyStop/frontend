"use client";

import {
  ButtonLink,
  Card,
  PageHeader,
  StatusPill,
  Stat,
  TargetBar,
} from "@/design-system";
import { MarksWaterfall } from "@/features/attempts/components/marks-waterfall";
import { QuestionReview } from "@/features/attempts/components/question-review";
import { ScoreTimeline } from "@/features/attempts/components/score-timeline";
import { SectionBreakdown } from "@/features/attempts/components/section-breakdown";
import { TopicScatter } from "@/features/attempts/components/topic-scatter";
import { TopicTheorySection } from "@/features/attempts/components/topic-theory";
import type { Scorecard } from "@/features/attempts/types";
import { verdictLabel } from "@/features/attempts/verdict";

export function ResultView({
  scorecard,
  flagged = false,
}: {
  scorecard: Scorecard;
  flagged?: boolean;
}) {
  // A drill you stopped partway still scores; saying so stops the low number reading as a bad sitting.
  const endedEarly =
    scorecard.mode !== "paper" &&
    scorecard.attempted < scorecard.totalQuestions;

  // The total is not the exam: a paper is cleared only if every section is.
  const missed = scorecard.sections.filter((s) => !s.cleared);
  const cleared =
    scorecard.target !== null &&
    scorecard.score >= scorecard.target &&
    missed.length === 0;
  const marksPerMin =
    scorecard.durationSec && scorecard.durationSec > 0
      ? (scorecard.score / (scorecard.durationSec / 60)).toFixed(2)
      : "—";

  return (
    <div>
      <PageHeader
        title={scorecard.paperName ?? "Drill result"}
        sub={`Sat ${new Date(scorecard.submittedAt ?? scorecard.startedAt).toLocaleString()}${
          scorecard.durationSec
            ? ` · ${Math.round(scorecard.durationSec / 60)} min`
            : ""
        }`}
      />

      {flagged ? (
        <p className="bg-warn-soft text-warn rounded-ctl mb-6 px-4 py-3 text-[13.5px] leading-relaxed">
          This attempt ended early — exam mode logged three window switches and
          submitted it exactly as it stood at that moment.
        </p>
      ) : null}

      <Card tone="ink" className="mb-8 px-7 py-9">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[12px] text-white/50">
            {scorecard.mode === "paper" ? "This sitting" : "This drill"}
          </p>
          {/* On the black card the pill is white paper: an amber fill on black read as a warning banner. */}
          <StatusPill tone="live">{verdictLabel(scorecard)}</StatusPill>
        </div>
        <p className="tnum mt-4 text-[26px] leading-none tracking-[-0.03em]">
          {scorecard.score.toFixed(2)}
          <span className="ml-2 text-[16px] text-white/45">
            / {scorecard.maxScore.toFixed(2)}
          </span>
        </p>
        <p className="mt-4 max-w-[62ch] text-[13.5px] leading-[1.6] text-white/85">
          {scorecard.target === null
            ? `${scorecard.correct} correct out of ${scorecard.attempted} attempted.`
            : cleared
              ? `Cleared every section, and the overall target by ${(scorecard.score - scorecard.target).toFixed(2)} marks.`
              : missed.length > 0
                ? `Short in ${missed.map((s) => s.section).join(", ")} — the total does not carry a section.`
                : `${(scorecard.target - scorecard.score).toFixed(2)} marks short of the overall target.`}
        </p>
        {endedEarly ? (
          <p className="mt-1.5 text-[13px] text-white/50">
            Ended early — {scorecard.attempted} of {scorecard.totalQuestions}{" "}
            answered before you stopped.
          </p>
        ) : null}
      </Card>

      {scorecard.target !== null ? (
        <div className="mb-6">
          <p className="text-ink-3 mb-2 text-[13px]">
            Score against the 55% target ({scorecard.target})
          </p>
          <TargetBar
            value={scorecard.score}
            target={scorecard.target}
            max={scorecard.maxScore}
          />
          <p className="text-ink-3 mt-2 text-[13px]">
            The target is 55% of this paper&rsquo;s questions — our benchmark,
            not the board&rsquo;s published cutoff.
          </p>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={scorecard.score.toFixed(2)} label="Score" />
        <Stat value={`${scorecard.accuracy.toFixed(0)}%`} label="Accuracy" />
        <Stat
          value={`${scorecard.attempted}/${scorecard.totalQuestions}`}
          label={`Attempted · ${scorecard.skipped} blank`}
        />
        <Stat value={marksPerMin} label="Marks / min" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <MarksWaterfall scorecard={scorecard} />
        <SectionBreakdown scorecard={scorecard} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <TopicScatter scorecard={scorecard} />
        <ScoreTimeline scorecard={scorecard} />
      </div>

      <TopicTheorySection theory={scorecard.theory} />

      <QuestionReview questions={scorecard.questions} />

      {scorecard.mode !== "paper" ? (
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/drills">Start another drill</ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
