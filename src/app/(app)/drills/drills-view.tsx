"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Card, PageHeader, SectionTitle } from "@/design-system";
import { SECTIONS, SECTION_SHORT, type Subject } from "@/data/navigation";

/* Drills. Defaults are the feature: land, press Start, you are practising.
   The set is already aimed at whatever the attempt map says is costing marks. */

const LENGTHS = [10, 20, 30] as const;
const MODES = ["Weak topics", "Speed", "Mixed"] as const;

const OPTIONS = ["arrive", "reach", "conclude", "gather"];

export function DrillsView() {
  const { board } = useApp();
  const [section, setSection] = useState<Subject>(SECTIONS[2]);
  const [len, setLen] = useState<(typeof LENGTHS)[number]>(20);
  const [mode, setMode] = useState<(typeof MODES)[number]>("Weak topics");
  const [running, setRunning] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const mins = Math.round((len * 45) / 60);

  if (running) {
    return (
      <div>
        <PageHeader
          title={`${SECTION_SHORT[section]} drill`}
          sub={`Question 1 of ${len} · ${mode.toLowerCase()}`}
          actions={
            <Button variant="secondary" onClick={() => setRunning(false)}>
              End drill
            </Button>
          }
        />

        <Card className="p-8">
          {/* Pace bar: the drill's whole point is training the 45-second
              instinct, so the budget is visible before you answer. */}
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-pill bg-line h-1.5 flex-1 overflow-hidden">
              <div className="rounded-pill bg-brand h-full w-1/4" />
            </div>
            <span className="tnum text-ink-3 text-[13px]">11s / 45s</span>
          </div>

          <p className="text-[17px] leading-relaxed">
            In the following passage one word is missing. Choose the option that
            best fits the blank.
          </p>
          <p className="bg-canvas text-ink-2 ring-line mt-4 rounded-[14px] p-5 text-[16px] leading-relaxed ring-1">
            The committee was unable to ______ a consensus despite three
            sittings.
          </p>

          <div className="mt-5 grid gap-2.5">
            {OPTIONS.map((o, i) => (
              <button
                key={o}
                onClick={() => setPicked(i)}
                className={`rounded-ctl flex items-center gap-3 border px-4 py-3.5 text-left text-[15px] transition-all ${
                  picked === i
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-canvas hover:border-line-2"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] ${
                    picked === i ? "bg-brand text-white" : "bg-line text-ink-3"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {o}
              </button>
            ))}
          </div>

          <div className="border-line mt-6 flex items-center gap-3 border-t pt-5">
            <Button disabled={picked === null}>Submit answer</Button>
            <Button variant="ghost">Skip · costs nothing</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${len} questions · ${SECTION_SHORT[section]} · ${mins} min`}
        sub={`Already aimed at the topics costing you marks in ${board}. Change anything, or just start.`}
        actions={<Button onClick={() => setRunning(true)}>Start drill</Button>}
      />

      <Card>
        <SectionTitle>Set up</SectionTitle>
        <div className="grid gap-5">
          <Field label="Section">
            {SECTIONS.map((s) => (
              <Pick key={s} on={section === s} onClick={() => setSection(s)}>
                {SECTION_SHORT[s]}
              </Pick>
            ))}
          </Field>
          <Field label="Length">
            {LENGTHS.map((l) => (
              <Pick key={l} on={len === l} onClick={() => setLen(l)}>
                {l}
              </Pick>
            ))}
          </Field>
          <Field label="Aim">
            {MODES.map((m) => (
              <Pick key={m} on={mode === m} onClick={() => setMode(m)}>
                {m}
              </Pick>
            ))}
          </Field>
        </div>

        <p className="border-line text-ink-3 mt-6 border-t pt-4 text-[13px] leading-relaxed">
          Weak topics pulls from the bottom-left of your attempt map. Speed
          keeps the accuracy you have and cuts the clock.
        </p>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-ink-3 w-20 shrink-0 text-[13px]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pick({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`tnum rounded-ctl h-9 border px-4 text-[13px] font-medium transition-colors ${
        on
          ? "border-ink bg-ink text-white"
          : "border-line bg-canvas text-ink-2 hover:border-line-2"
      }`}
    >
      {children}
    </button>
  );
}
