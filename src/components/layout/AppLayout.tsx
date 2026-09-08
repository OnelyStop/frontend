"use client";

import { Suspense } from "react";
import { CompanionPanel } from "@/features/companion/CompanionPanel";
import { CompanionProvider } from "@/features/companion/CompanionContext";
import { SelectionAsk } from "@/features/companion/SelectionAsk";
import { RetrievalProvider } from "@/features/retrieval/RetrievalContext";
import { RetrievalSlip } from "@/features/retrieval/RetrievalSlip";
import { useApp } from "@/context/AppContext";
import { CanvasRail } from "./CanvasRail";
import { RunningHead, SUBJECT_INK } from "./RunningHead";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { subject } = useApp();

  return (
    <CompanionProvider>
      <RetrievalProvider>
        <div
          className="bg-sky min-h-screen p-2.5 sm:p-3"
          style={{ ["--subj" as string]: SUBJECT_INK[subject] }}
        >
          {/* The frame fills the viewport; the sky is a rim, not a margin. */}
          <div className="bg-frame flex min-h-[calc(100svh-1.5rem)] w-full flex-col rounded-[28px]">
            <Suspense fallback={<div className="h-20" />}>
              <RunningHead />
            </Suspense>

            <div className="relative flex-1 px-2.5 pb-2.5">
              <div className="bg-stage relative min-h-full rounded-[24px] px-5 pt-9 pb-14 sm:px-7">
                <Bump />
                <div className="grid gap-x-9 lg:grid-cols-[72px_minmax(0,1fr)]">
                  <CanvasRail />
                  {/* No z-index: a stacking context traps full-screen overlays. */}
                  <main className="relative min-w-0">{children}</main>
                </div>
              </div>
            </div>
          </div>

          <SelectionAsk />
          <CompanionPanel />
          <RetrievalSlip />
        </div>
      </RetrievalProvider>
    </CompanionProvider>
  );
}

// A frame-coloured square with one rounded corner is what reads as a concave fillet.
function Bump() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
    >
      <span className="bg-stage absolute -top-7 left-[-76px] h-8 w-38 rounded-t-[18px]" />
      <span className="bg-frame absolute top-0 left-[-96px] size-5 rounded-bl-[20px]" />
      <span className="bg-frame absolute top-0 left-19 size-5 rounded-br-[20px]" />
    </div>
  );
}
