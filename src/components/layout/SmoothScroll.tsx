"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

const SCROLL_DURATION = 1.4;

// Exponential ease-out: a linear curve at this duration is what reads as floaty.
const SCROLL_EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// Takes the setting as a prop rather than reading app context, so public pages can scroll smoothly without shipping auth.
export function SmoothScroll({
  reduceMotion = false,
}: {
  reduceMotion?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (
      reduceMotion ||
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
  }, [reduceMotion]);

  // Lenis owns window scroll, so route changes need an explicit jump to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
