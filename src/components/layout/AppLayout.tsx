"use client";

import { Suspense, useEffect, useState } from "react";
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
          className="bg-frame min-h-screen"
          style={{ ["--subj" as string]: SUBJECT_INK[subject] }}
        >
          {/* Full bleed: the frame is the page, not a card floating on one. */}
          <div className="flex min-h-svh w-full flex-col">
            <Suspense fallback={<div className="h-17" />}>
              <RunningHead />
            </Suspense>

            <div className="relative flex flex-1 flex-col px-3 pb-3">
              <div className="bg-stage relative flex-1 rounded-[26px] px-6 pt-11 pb-16 sm:px-10">
                <Bump />
                <div className="grid gap-x-9 lg:grid-cols-[64px_minmax(0,1fr)]">
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

// Measured, not computed: the nav is a sibling, so nothing knows both boxes.
function Bump() {
  const [x, setX] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      const el = document.querySelector<HTMLElement>("[data-nav-active]");
      if (!el) return setX(null);
      const r = el.getBoundingClientRect();
      setX(r.left + r.width / 2);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, { attributes: true, subtree: true });
    window.addEventListener("resize", read);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  if (x === null) return null;

  return (
    <svg
      aria-hidden
      viewBox="0 0 132 18"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -top-[17px] hidden h-[18px] w-33 -translate-x-1/2 lg:block"
      style={{ left: x }}
    >
      <path
        d="M0 18 C 30 18 30 0 66 0 C 102 0 102 18 132 18 Z"
        fill="var(--color-stage)"
      />
    </svg>
  );
}
