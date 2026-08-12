import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { useApp } from "../../context/AppContext";
import { Dock } from "./Dock";
import { TopBar } from "./TopBar";

const STORAGE_KEY = "onelystopp.dockPinned";

export function AppLayout() {
  const { settings } = useApp();
  const { pathname } = useLocation();
  const [pinned, setPinned] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(pinned));
    } catch {
      /* ignore */
    }
  }, [pinned]);

  useEffect(() => {
    if (
      settings.reduceMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    // Light smoothing — takes the edge off native scroll without feeling floaty
    const lenis = new Lenis({ duration: 0.5, smoothWheel: true });
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

  return (
    <div className={`app-shell ${pinned ? "app-shell--dock-pinned" : ""}`}>
      <Dock pinned={pinned} onTogglePin={() => setPinned((v) => !v)} />
      <div className="app-main">
        <TopBar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
