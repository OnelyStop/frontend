"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand, Button, cn } from "@/design-system";

/** One question, centred on the stage, with a rail that shows how far in you are. */
export function StepShell({
  step,
  total,
  question,
  hint,
  onBack,
  onNext,
  nextLabel = "Continue",
  canAdvance,
  busy,
  error,
  footer,
  hanger,
  children,
}: {
  step: number;
  total: number;
  question: string;
  hint?: string;
  /** Omitted on the first step, where back means leaving signup. */
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  canAdvance: boolean;
  busy?: boolean;
  error?: string | null;
  footer?: ReactNode;
  /** Hangs from the progress rail, beside the question rather than over it. */
  hanger?: ReactNode;
  children: ReactNode;
}) {
  // Derived during render, not in an effect, so the lean is right on the very frame the step changes.
  const [prevStep, setPrevStep] = useState(step);
  const [lean, setLean] = useState(0);
  if (step !== prevStep) {
    setLean(step > prevStep ? 7 : -7);
    setPrevStep(step);
  }

  return (
    <div className="bg-stage flex min-h-dvh flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back a step"
            className="press bg-canvas text-ink-2 hover:text-ink shadow-card grid size-11 shrink-0 place-items-center rounded-full"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Leave signup"
            className="press bg-canvas text-ink-2 hover:text-ink shadow-card grid size-11 shrink-0 place-items-center rounded-full"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
        )}

        {/* Segments, not a sliding bar: the count of what is left is the useful fact. */}
        <div
          className="relative flex flex-1 items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step}
          aria-label={`Step ${step} of ${total}`}
        >
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                i < step ? "bg-frame" : "bg-line-2"
              }`}
            />
          ))}
          {hanger ? (
            <div
              className="pointer-events-none absolute top-[calc(50%-8px)] z-10 hidden w-36 -translate-x-1/2 transition-[left] duration-[1400ms] ease-[cubic-bezier(0.45,0,0.3,1)] motion-reduce:transition-none lg:block"
              style={{ left: `${((step - 0.5) / total) * 100}%` }}
            >
              <div
                key={step}
                className={cn(
                  "origin-top motion-reduce:animate-none",
                  lean === 0
                    ? "animate-[koala-sway_5s_cubic-bezier(0.45,0,0.55,1)_both]"
                    : "animate-[koala-settle_3.6s_ease-in-out_both]",
                )}
                style={{ "--koala-lean": `${lean}deg` } as CSSProperties}
              >
                {hanger}
              </div>
            </div>
          ) : null}
        </div>

        <Brand href="/" className="text-ink hidden shrink-0 sm:block" />
      </header>

      <div className="flex flex-1 items-center justify-center py-10 lg:pt-28">
        <div className="w-full max-w-135 text-center">
          <h1 className="text-[26px] leading-[1.16] font-bold tracking-[-0.03em] text-balance sm:text-[32px]">
            {question}
          </h1>
          {hint ? (
            <p className="text-ink-2 mx-auto mt-3 max-w-[46ch] text-[14.5px] leading-relaxed">
              {hint}
            </p>
          ) : null}

          <div className="mt-9">{children}</div>

          {error ? (
            <p
              role="alert"
              className="bg-bad-soft text-bad rounded-ctl mx-auto mt-6 max-w-95 px-3.5 py-2.5 text-[13.5px]"
            >
              {error}
            </p>
          ) : null}

          <div className="mx-auto mt-9 max-w-95">
            <Button
              size="lg"
              block
              onClick={onNext}
              disabled={!canAdvance || busy}
            >
              {busy ? "Just a moment…" : nextLabel}
            </Button>
            {footer ? (
              <div className="text-ink-3 mt-5 text-[13.5px]">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A choice on a step: a tinted card that fills when it is the answer. */
export function ChoiceCard({
  label,
  hint,
  tint,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  /** A section tint, so the exam a user picks carries the colour they will live in. */
  tint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`press rounded-card relative flex flex-col items-start gap-1 p-5 text-left transition-shadow duration-200 ${
        selected ? "shadow-lift outline-frame outline-2" : "shadow-card"
      } ${tint}`}
    >
      <span className="text-[16px] leading-tight font-bold tracking-[-0.02em]">
        {label}
      </span>
      {hint ? (
        <span className="text-[12.5px] leading-snug text-black/55">{hint}</span>
      ) : null}
    </button>
  );
}
