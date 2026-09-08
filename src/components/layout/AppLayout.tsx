"use client";

import { Suspense } from "react";
import { CompanionPanel } from "@/features/companion/CompanionPanel";
import { CompanionProvider } from "@/features/companion/CompanionContext";
import { SelectionAsk } from "@/features/companion/SelectionAsk";
import { RetrievalProvider } from "@/features/retrieval/RetrievalContext";
import { RetrievalSlip } from "@/features/retrieval/RetrievalSlip";
import { useApp } from "@/context/AppContext";
import { RunningHead, SUBJECT_INK } from "./RunningHead";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { subject } = useApp();

  return (
    <CompanionProvider>
      <RetrievalProvider>
        <div
          className="bg-stage min-h-screen"
          style={{ ["--subj" as string]: SUBJECT_INK[subject] }}
        >
          {/* RunningHead reads search params; that needs a boundary. */}
          <Suspense fallback={<div className="border-line h-16 border-b" />}>
            <RunningHead />
          </Suspense>

          <div
            aria-hidden
            className="pointer-events-none fixed inset-y-0 left-1/2 z-0 hidden w-full max-w-[1200px] -translate-x-1/2 lg:block"
          >
            <span className="bg-line absolute inset-y-0 left-8 w-px" />
            <span className="bg-line absolute inset-y-0 right-8 w-px" />
          </div>

          {/* No z-index: a stacking context traps full-screen overlays. */}
          <main className="relative mx-auto w-full max-w-[1200px] px-8 pt-14 pb-32 lg:px-16">
            {children}
          </main>
          <SelectionAsk />
          <CompanionPanel />
          <RetrievalSlip />
        </div>
      </RetrievalProvider>
    </CompanionProvider>
  );
}
