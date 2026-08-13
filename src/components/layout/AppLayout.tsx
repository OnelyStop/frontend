import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { Dock } from "./Dock";
import { TopBar } from "./TopBar";

const STORAGE_KEY = "onelystopp.dockPinned";

export function AppLayout() {
  const { settings } = useApp();
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

  useSmoothScroll(settings.reduceMotion);

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
