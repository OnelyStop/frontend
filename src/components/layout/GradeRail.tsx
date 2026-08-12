import { CalendarDays, Flame } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GRADE_LADDER } from "../../data/navigation";
import "./GradeRail.css";

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Props = {
  collapsed: boolean;
};

// A* Ascent — the dock's signature widget. Shows the student's working
// grade climbing the C→A* ladder, exam-day countdown, and streak. Collapses
// into a progress ring so the journey stays visible in the resting dock.
export function GradeRail({ collapsed }: Props) {
  const {
    subject,
    board,
    workingGrade,
    nextGrade,
    railPosition,
    examDaysLeft,
    streak,
    settings,
  } = useApp();

  const summary = `Working at ${workingGrade}${
    nextGrade ? ` · ${nextGrade} within reach` : " · top grade reached"
  } · ${board} ${subject}`;

  if (collapsed) {
    return (
      <div
        className="grade-rail grade-rail--mini"
        title={`${summary} · Exam in ${examDaysLeft} days · ${streak}-day streak`}
      >
        <svg viewBox="0 0 40 40" aria-hidden>
          <circle className="grade-rail__ring-bg" cx="20" cy="20" r={RING_RADIUS} />
          <circle
            className="grade-rail__ring-fill"
            cx="20"
            cy="20"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - railPosition)}
          />
        </svg>
        <span className="grade-rail__mini-grade">{workingGrade}</span>
      </div>
    );
  }

  return (
    <div
      className={`grade-rail ${settings.reduceMotion ? "grade-rail--still" : ""}`}
      title={summary}
    >
      <div className="grade-rail__header">
        <span className="grade-rail__title">Path to A*</span>
        <span className="grade-rail__chip">{workingGrade}</span>
      </div>

      <div className="grade-rail__track">
        <div
          className="grade-rail__fill"
          style={{ width: `${railPosition * 100}%` }}
        />
        {GRADE_LADDER.map((stop, i) => {
          const pos = i / (GRADE_LADDER.length - 1);
          return (
            <span
              key={stop.grade}
              className={`grade-rail__stop ${
                railPosition >= pos ? "grade-rail__stop--reached" : ""
              }`}
              style={{ left: `${pos * 100}%` }}
            />
          );
        })}
        <span
          className="grade-rail__marker"
          style={{ left: `${railPosition * 100}%` }}
        />
      </div>

      <div className="grade-rail__labels">
        {GRADE_LADDER.map((stop, i) => {
          const pos = i / (GRADE_LADDER.length - 1);
          return (
            <span
              key={stop.grade}
              className={`grade-rail__label ${
                railPosition >= pos ? "grade-rail__label--reached" : ""
              }`}
              style={{ left: `${pos * 100}%` }}
            >
              {stop.grade}
            </span>
          );
        })}
      </div>

      <div className="grade-rail__meta">
        <span className="grade-rail__days">
          <CalendarDays size={12} strokeWidth={2} />
          Exam in {examDaysLeft}d
        </span>
        <span className="grade-rail__streak">
          <Flame size={12} strokeWidth={2} />
          {streak}
        </span>
      </div>
    </div>
  );
}
