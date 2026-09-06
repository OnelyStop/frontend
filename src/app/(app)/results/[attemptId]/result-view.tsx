"use client";

import {
  DarkPanel,
  Lattice,
  LatticeCell,
  PageHeader,
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

export function ResultView({ scorecard }: { scorecard: Scorecard }) {
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

      <DarkPanel className="mb-6">
        <p className="text-[13px] text-white/60">
          {scorecard.mode === "paper" ? "This sitting" : "This drill"}
        </p>
        <p className="tnum mt-2 text-[48px] leading-none tracking-[-0.03em]">
          {scorecard.score.toFixed(2)}
          <span className="ml-2 text-[20px] text-white/40">
            / {scorecard.maxScore.toFixed(2)}
          </span>
        </p>
        <p className="mt-3 text-[15px]">
          {scorecard.target === null
            ? `${scorecard.correct} correct out of ${scorecard.attempted} attempted.`
            : cleared
              ? `Cleared every section, and the overall target by ${(scorecard.score - scorecard.target).toFixed(2)} marks.`
              : missed.length > 0
                ? `Short in ${missed.map((s) => s.section).join(", ")} — the total does not carry a section.`
                : `${(scorecard.target - scorecard.score).toFixed(2)} marks short of the overall target.`}
        </p>
      </DarkPanel>

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

      <Lattice cols={4} className="mb-6">
        <LatticeCell>
          <Stat label="Score" value={scorecard.score.toFixed(2)} />
        </LatticeCell>
        <LatticeCell>
          <Stat label="Accuracy" value={`${scorecard.accuracy.toFixed(0)}%`} />
        </LatticeCell>
        <LatticeCell>
          <Stat
            label="Attempted"
            value={`${scorecard.attempted}/${scorecard.totalQuestions}`}
            note={`${scorecard.skipped} left blank`}
          />
        </LatticeCell>
        <LatticeCell>
          <Stat label="Marks / min" value={marksPerMin} />
        </LatticeCell>
      </Lattice>

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
    </div>
  );
}
