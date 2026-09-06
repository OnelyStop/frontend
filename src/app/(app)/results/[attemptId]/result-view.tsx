"use client";

import {
  CutoffBar,
  DarkPanel,
  Lattice,
  LatticeCell,
  PageHeader,
  Stat,
} from "@/design-system";
import { MarksWaterfall } from "@/features/attempts/components/marks-waterfall";
import { QuestionReview } from "@/features/attempts/components/question-review";
import { ScoreTimeline } from "@/features/attempts/components/score-timeline";
import { SectionBreakdown } from "@/features/attempts/components/section-breakdown";
import { TopicScatter } from "@/features/attempts/components/topic-scatter";
import { TopicTheorySection } from "@/features/attempts/components/topic-theory";
import type { Scorecard } from "@/features/attempts/types";

export function ResultView({ scorecard }: { scorecard: Scorecard }) {
  const cleared =
    scorecard.cutoff !== null && scorecard.score >= scorecard.cutoff;
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
          {scorecard.cutoff !== null
            ? cleared
              ? `Cleared the cutoff by ${(scorecard.score - scorecard.cutoff).toFixed(2)} marks.`
              : `${(scorecard.cutoff - scorecard.score).toFixed(2)} marks short of the cutoff.`
            : `${scorecard.correct} correct out of ${scorecard.attempted} attempted.`}
        </p>
      </DarkPanel>

      {scorecard.cutoff !== null ? (
        <div className="mb-6">
          <p className="text-ink-3 mb-2 text-[13px]">
            Score against cutoff ({scorecard.cutoff})
          </p>
          <CutoffBar
            value={scorecard.score}
            cutoff={scorecard.cutoff}
            max={scorecard.maxScore}
          />
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
