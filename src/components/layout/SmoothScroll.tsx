"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useApp } from "@/context/AppContext";

const SCROLL_DURATION = 1.4;

const SCROLL_EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
