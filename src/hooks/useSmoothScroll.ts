import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

// Light smoothing — takes the edge off native scroll without feeling floaty
const SCROLL_DURATION = 0.5;

export function useSmoothScroll(disabled = false) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (
      disabled ||
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
  }, [disabled]);

  // Lenis owns window scroll, so route changes need an explicit jump to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}
