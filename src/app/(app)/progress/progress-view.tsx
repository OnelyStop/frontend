"use client";

import { Card, PageHeader, SectionTitle } from "@/design-system";
import { useApp } from "@/context/AppContext";
import { NEGATIVE_MARK, SECTIONS, SECTION_SHORT } from "@/data/navigation";

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

      <div className="border-line mb-10 grid grid-cols-1 border-t border-l md:grid-cols-3">
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
                  <div className="rounded-pill bg-line h-1.5 overflow-hidden">
                    <div
                      className="rounded-pill bg-ink h-full"
                      style={{ width: `${a}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="border-line text-ink-3 mt-7 border-t pt-5 text-[13px] leading-relaxed">
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
                <span className="text-ink-4 text-center text-[12px]">
                  {DAYS[i]}
                </span>
              </div>
            ))}
          </div>

          <p className="border-line text-ink-3 mt-6 border-t pt-5 text-[13px] leading-relaxed">
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
    <div className="border-line relative border-r border-b p-7">
      <p className="text-ink-2 text-[14px]">{label}</p>
      <p className="tnum mt-3 text-[38px] leading-none tracking-[-0.03em]">
        {value}
      </p>
      <p className="text-ink-3 mt-3 text-[13px] leading-relaxed">{note}</p>
      <span
        aria-hidden
        className="bg-ink-4 absolute right-[-2.5px] bottom-[-2.5px] size-[5px] rounded-full"
      />
    </div>
  );
}
