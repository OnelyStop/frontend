"use client";

import { Card, PageHeader, SectionTitle } from "@/design-system";
import { useApp } from "@/context/AppContext";
import { NEGATIVE_MARK, SECTIONS, SECTION_SHORT } from "@/data/navigation";

/* Progress. Speed and accuracy are the two numbers that decide a banking
   result, so they are the two the page is built on — plus the marks negative
   marking has actually taken off you, which nobody shows. */

const SECT = [
  { s: SECTIONS[0], attempted: 412, correct: 271, sec: 52 },
  { s: SECTIONS[1], attempted: 380, correct: 268, sec: 61 },
  { s: SECTIONS[2], attempted: 296, correct: 172, sec: 39 },
  { s: SECTIONS[3], attempted: 340, correct: 214, sec: 17 },
  { s: SECTIONS[4], attempted: 120, correct: 99, sec: 15 },
];

const WEEK = [42, 61, 0, 78, 55, 90, 34];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function ProgressView() {
  const { board } = useApp();
  const att = SECT.reduce((n, r) => n + r.attempted, 0);
  const cor = SECT.reduce((n, r) => n + r.correct, 0);
  const wrong = att - cor;
  const lost = wrong * NEGATIVE_MARK;
  const acc = Math.round((cor / att) * 100);

  return (
    <>
      <PageHeader
        title="Progress"
        sub={`${board} · last 30 days. Accuracy alone does not clear a cutoff — pace and the marks negative marking takes back decide the paper.`}
      />

      <div className="mb-10 grid grid-cols-1 border-l border-t border-line md:grid-cols-3">
        <Stat
          label="Accuracy"
          value={`${acc}%`}
          note={`${cor} of ${att} attempted`}
        />
        <Stat
          label="Marks lost to negatives"
          value={`−${lost.toFixed(2)}`}
          note={`${wrong} wrong × ${NEGATIVE_MARK}`}
        />
        <Stat
          label="Average pace"
          value="43s"
          note="target is 45s a question"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <SectionTitle aside="accuracy · seconds per question">
            By section
          </SectionTitle>

          <div className="grid gap-5">
            {SECT.map((r) => {
              const a = Math.round((r.correct / r.attempted) * 100);
              const fast = r.sec <= 45;
              return (
                <div key={r.s} className="grid gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[14.5px]">{SECTION_SHORT[r.s]}</span>
                    <span className="flex-1" />
                    <span className="tnum text-[14.5px]">{a}%</span>
                    <span
                      className={`tnum w-10 text-right text-[13px] ${fast ? "text-ok" : "text-bad"}`}
                    >
                      {r.sec}s
                    </span>
                  </div>
                  {/* One weight for volume; colour is spent on the pace verdict
                      beside it, which is the number that decides the paper. */}
                  <div className="h-1.5 overflow-hidden rounded-pill bg-line">
                    <div
                      className="h-full rounded-pill bg-ink"
                      style={{ width: `${a}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-7 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-3">
            A section can be accurate and still cost you the paper if it is
            slow. Reasoning is your best accuracy and your worst pace.
          </p>
        </Card>

        <Card>
          <SectionTitle aside="360 questions">This week</SectionTitle>

          <div className="flex h-40 gap-2">
            {WEEK.map((q, i) => (
              <div key={i} className="flex flex-1 flex-col gap-2">
                <div className="flex flex-1 items-end">
                  <div
                    className={`w-full rounded-t-sm transition-all ${q ? "bg-ink" : "bg-line"}`}
                    style={{ height: `${Math.max(3, (q / 90) * 100)}%` }}
                    title={`${q} questions`}
                  />
                </div>
                <span className="text-center text-[12px] text-ink-4">
                  {DAYS[i]}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-6 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-3">
            Wednesday is the only blank day. A broken streak costs more in
            recall than a heavy Saturday gains.
          </p>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="relative border-b border-r border-line p-7">
      <p className="text-[14px] text-ink-2">{label}</p>
      <p className="tnum mt-3 text-[38px] leading-none tracking-[-0.03em]">
        {value}
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{note}</p>
      <span
        aria-hidden
        className="absolute bottom-[-2.5px] right-[-2.5px] size-[5px] rounded-full bg-ink-4"
      />
    </div>
  );
}
