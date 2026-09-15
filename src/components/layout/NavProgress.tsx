"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

type Phase = "idle" | "loading" | "done";

// loading.tsx only arrives with the server's first bytes, and dev never prefetches, so a first visit shows nothing until then. This answers the click itself.
export function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download"))
        return;
      const url = new URL(a.href);
      if (url.origin !== location.origin || url.pathname === location.pathname)
        return;
      setRun((n) => n + 1);
      setPhase("loading");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  useEffect(() => {
    setPhase((p) => (p === "loading" ? "done" : p));
  }, [pathname]);

  // A click that never becomes a navigation (a prevented handler, a redirect back here) must not leave the bar hanging.
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("done"), 15000);
    return () => clearTimeout(t);
  }, [phase, run]);

  if (phase === "idle") return null;

  return (
    <motion.div
      key={run}
      aria-hidden
      initial={{ scaleX: 0, opacity: 0 }}
      animate={
        phase === "loading"
          ? { scaleX: 0.9, opacity: 1 }
          : { scaleX: 1, opacity: 0 }
      }
      transition={
        phase === "loading"
          ? {
              scaleX: { duration: 8, ease: [0.08, 0.82, 0.17, 1] },
              opacity: { duration: 0.15, delay: 0.1 },
            }
          : {
              scaleX: { duration: 0.2 },
              opacity: { duration: 0.25, delay: 0.15 },
            }
      }
      className="pointer-events-none fixed inset-x-0 top-0 z-70 h-[3px] origin-left bg-[linear-gradient(90deg,#b98cff,#f3dcff)] shadow-[0_0_10px_rgb(201_167_255/0.7)]"
    />
  );
}
