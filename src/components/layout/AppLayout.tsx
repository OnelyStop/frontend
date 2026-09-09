"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { CompanionPanel } from "@/features/companion/CompanionPanel";
import {
  CompanionProvider,
  useCompanion,
} from "@/features/companion/CompanionContext";
import { SelectionAsk } from "@/features/companion/SelectionAsk";
import { RetrievalProvider } from "@/features/retrieval/RetrievalContext";
import { RetrievalSlip } from "@/features/retrieval/RetrievalSlip";
import { useApp } from "@/context/AppContext";
import { CanvasRail } from "./CanvasRail";
import { RunningHead, SUBJECT_INK } from "./RunningHead";

export function AppLayout({
  children,
  unread = 0,
  isAdmin = false,
}: {
  children: React.ReactNode;
  unread?: number;
  isAdmin?: boolean;
}) {
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
            <Suspense fallback={<div className="h-20" />}>
              <RunningHead isAdmin={isAdmin} />
            </Suspense>

            <Stage unread={unread}>{children}</Stage>
          </div>

          <SelectionAsk />
          <RetrievalSlip />
        </div>
      </RetrievalProvider>
    </CompanionProvider>
  );
}

// Ask Onely is a column, not an overlay: opening it reflows the page rather than covering it.
function Stage({
  children,
  unread,
}: {
  children: React.ReactNode;
  unread: number;
}) {
  const { open } = useCompanion();

  return (
    <div className="relative flex flex-1 flex-col px-3 pb-3">
      <div className="bg-stage relative flex-1 rounded-[26px] px-6 pt-11 pb-16 sm:px-10">
        <Bump />
        <div
          className={`grid gap-x-9 ${
            open
              ? "lg:grid-cols-[64px_minmax(0,1fr)_360px]"
              : "lg:grid-cols-[64px_minmax(0,1fr)]"
          }`}
        >
          <CanvasRail unread={unread} />
          {/* No z-index: a stacking context traps full-screen overlays. */}
          <main className="relative min-w-0">{children}</main>
          <CompanionPanel />
        </div>
      </div>
    </div>
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
    // Two pixels of the base sit inside the stage; flush, the two fills leave an antialiased seam.
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 64 12"
      className="pointer-events-none absolute -top-3 hidden h-3.5 w-14.5 -translate-x-1/2 lg:block"
      style={{ left: x ?? -999 }}
    >
      {/* The first quarter runs flat along the baseline, so it grows out of the stage rather than starting as a step. */}
      <path
        d="M0 12 C 16 12 19 7 24 3.6 Q32 -2.4 40 3.6 C 45 7 48 12 64 12 Z"
        fill="var(--color-stage)"
      />
    </svg>
  );
}
