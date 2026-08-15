"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useApp } from "@/context/AppContext";

// Light smoothing — takes the edge off native scroll without feeling floaty
const SCROLL_DURATION = 0.5;

// Renders nothing; it exists so the root layout can own scroll behaviour
// without becoming a client component itself
export function SmoothScroll() {
  const { settings } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    if (
      settings.reduceMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const lenis = new Lenis({ duration: SCROLL_DURATION, smoothWheel: true });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [settings.reduceMotion]);

  // Lenis owns window scroll, so route changes need an explicit jump to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
