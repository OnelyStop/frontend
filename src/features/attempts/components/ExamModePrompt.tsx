"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Flag, Maximize, ShieldOff, X } from "lucide-react";
import { Button } from "@/design-system";

const DOS = [
  "Find a quiet room and tell whoever you live with not to interrupt you.",
  "Keep your phone somewhere you can't reach it without standing up.",
  "Use the on-screen clock only — a stopwatch on another device is still a second screen.",
  "Treat every submitted section as final, because in here it is.",
];

const DONTS = [
  "Don't switch tabs or apps to check a formula, a message, or the time.",
  "Don't exit full screen to glance at anything — the hall doesn't let you either.",
  "Don't assume a flag can be undone. It can't, and neither can the third one.",
];

export function ExamModePrompt({
  paperTitle,
  mins,
  discardsProgress,
  onChoose,
  onCancel,
}: {
  paperTitle: string;
  mins: number;
  /** True when this prompt precedes a "start over" that will discard an existing paused attempt. */
  discardsProgress: boolean;
  onChoose: (examMode: boolean) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"choose" | "rules">("choose");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onCancel();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [onCancel]);

  return (
    <div
      className="bg-ink/20 fixed inset-0 z-90 grid place-items-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="pop-in border-line bg-canvas shadow-pop relative max-h-[85vh] w-125 max-w-full overflow-y-auto rounded-[24px] border p-7">
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="rounded-ctl text-ink-3 hover:bg-line hover:text-ink absolute top-4 right-4 grid size-8 place-items-center transition-colors"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        {step === "choose" ? (
          <>
            <h2 className="max-w-[85%] text-[19px] font-semibold tracking-[-0.02em]">
              How do you want to sit {paperTitle}?
            </h2>
            {discardsProgress ? (
              <p className="text-bad mt-2 text-[13px]">
                Starting over discards your saved progress on this paper.
              </p>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => onChoose(false)}
                className="card border-line hover:border-ink/25 rounded-[16px] border p-4 text-left transition-colors"
              >
                <span className="text-[15px] font-medium">Normal mode</span>
                <span className="text-ink-3 mt-1 block text-[13px] leading-relaxed">
                  Sit it the way you do today — switch tabs, step away, no
                  restrictions.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStep("rules")}
                className="card border-line hover:border-ink/25 rounded-[16px] border p-4 text-left transition-colors"
              >
                <span className="text-[15px] font-medium">Exam mode</span>
                <span className="text-ink-3 mt-1 block text-[13px] leading-relaxed">
                  Full screen, window-switching tracked — closest we can get to
                  sitting it in the hall.
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="text-ink-3 hover:text-ink mb-3 inline-flex items-center gap-1.5 text-[13px] transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back
            </button>

            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
              Before you begin — exam mode
            </h2>

            <ul className="mt-5 grid gap-4">
              <li className="flex gap-3">
                <Clock
                  size={17}
                  strokeWidth={1.75}
                  className="text-ink-3 mt-0.5 shrink-0"
                />
                <p className="text-[13.5px] leading-relaxed">
                  Set aside{" "}
                  <span className="font-medium">{mins} minutes, straight</span>{" "}
                  — once you begin there's no pausing partway without it costing
                  you a flag. Section timing runs exactly as it does in Normal
                  mode; the mode only changes what happens if you leave the
                  screen.
                </p>
              </li>
              <li className="flex gap-3">
                <Maximize
                  size={17}
                  strokeWidth={1.75}
                  className="text-ink-3 mt-0.5 shrink-0"
                />
                <p className="text-[13.5px] leading-relaxed">
                  The screen locks to full screen. Switching to another tab,
                  app, or window is logged as a flag the moment it happens.
                </p>
              </li>
              <li className="flex gap-3">
                <Flag
                  size={17}
                  strokeWidth={1.75}
                  className="text-ink-3 mt-0.5 shrink-0"
                />
                <p className="text-[13.5px] leading-relaxed">
                  <span className="font-medium">Three flags end it</span> — the
                  attempt is submitted immediately, exactly as it stands at that
                  moment.
                </p>
              </li>
              <li className="flex gap-3">
                <ShieldOff
                  size={17}
                  strokeWidth={1.75}
                  className="text-ink-3 mt-0.5 shrink-0"
                />
                <p className="text-[13.5px] leading-relaxed">
                  <span className="font-medium">
                    We never use your camera or microphone
                  </span>{" "}
                  — nothing here is recorded, nothing is watched. This runs
                  entirely on your own word, which is exactly why it's worth
                  taking as seriously as the real thing.
                </p>
              </li>
            </ul>

            <div className="border-line mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
              <div>
                <p className="text-ink-3 text-[11.5px] font-semibold tracking-[0.02em] uppercase">
                  Do
                </p>
                <ul className="mt-2 grid gap-1.5">
                  {DOS.map((d) => (
                    <li
                      key={d}
                      className="text-ink-2 text-[12.5px] leading-relaxed"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-ink-3 text-[11.5px] font-semibold tracking-[0.02em] uppercase">
                  Don't
                </p>
                <ul className="mt-2 grid gap-1.5">
                  {DONTS.map((d) => (
                    <li
                      key={d}
                      className="text-ink-2 text-[12.5px] leading-relaxed"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button block className="mt-6" onClick={() => onChoose(true)}>
              Begin in exam mode
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
