"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useApp } from "@/context/AppContext";

const SCROLL_DURATION = 1.4;

// Exponential ease-out: moves immediately on input, then settles. A linear or
// symmetric curve at this duration is what reads as floaty.
const SCROLL_EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// Renders nothing — keeps the root layout a server component.
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
    const lenis = new Lenis({
      duration: SCROLL_DURATION,
      easing: SCROLL_EASING,
      smoothWheel: true,
    });
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
