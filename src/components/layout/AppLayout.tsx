"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  const ref = useRef<SVGSVGElement>(null);
  const [x, setX] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      const el = document.querySelector<HTMLElement>("[data-nav-active]");
      const box = ref.current?.parentElement;
      if (!el || !box) return setX(null);
      const nav = el.getBoundingClientRect();
      // Both boxes are viewport-relative; `left` is relative to the stage.
      const stage = box.getBoundingClientRect();
      setX(nav.left + nav.width / 2 - stage.left);
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

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 30 14"
      className="pointer-events-none absolute -top-3.5 hidden h-3.5 w-7.5 -translate-x-1/2 lg:block"
      style={{ left: x ?? -999 }}
    >
      {/* Straight flanks and a rounded apex — a peak, not a hill. */}
      <path d="M0 14 L11 3 Q15 -0.6 19 3 L30 14 Z" fill="var(--color-stage)" />
    </svg>
  );
}
