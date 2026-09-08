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
          className="bg-sky min-h-screen px-4 py-6 sm:px-6 sm:py-8"
          style={{ ["--subj" as string]: SUBJECT_INK[subject] }}
        >
          {/* The frame is the black chrome; the stage is the ground cards sit on. */}
          <div className="bg-frame mx-auto w-full max-w-[1560px] rounded-[36px] pb-4">
            <Suspense fallback={<div className="h-24" />}>
              <RunningHead />
            </Suspense>

            <div className="bg-stage rounded-[32px] px-5 pt-8 pb-16 sm:px-8">
              <div className="grid gap-x-10 lg:grid-cols-[76px_minmax(0,1fr)]">
                <CanvasRail />
                {/* No z-index: a stacking context traps full-screen overlays. */}
                <main className="relative min-w-0">{children}</main>
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
