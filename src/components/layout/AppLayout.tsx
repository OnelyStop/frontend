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
          className="min-h-screen bg-canvas"
          style={{ ["--subj" as string]: SUBJECT_INK[subject] }}
        >
          {/* The head reads a deep-link param as a crumb, so it needs the
              search params — which need a boundary to prerender past. */}
          <Suspense fallback={<div className="h-16 border-b border-line" />}>
            <RunningHead />
          </Suspense>

          <div
            aria-hidden
            className="pointer-events-none fixed inset-y-0 left-1/2 z-0 hidden w-full max-w-[1200px] -translate-x-1/2 lg:block"
          >
            <span className="absolute inset-y-0 left-8 w-px bg-line" />
            <span className="absolute inset-y-0 right-8 w-px bg-line" />
          </div>

          {/* No z-index here on purpose. A stacking context would trap any
              full-screen overlay a page renders — exam conditions has to cover
              the header, and z-50 inside z-10 never can. Painting order puts
              this above the rules regardless, since it comes after them. */}
          <main className="relative mx-auto w-full max-w-[1200px] px-8 pb-32 pt-14 lg:px-16">
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
