"use client";

import { useEffect, useState } from "react";
import { Dock } from "./Dock";
import { TopBar } from "./TopBar";

const STORAGE_KEY = "onelystopp.dockPinned";

export function AppLayout({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  // localStorage can't seed state: client components render on the server too.
  const [pinned, setPinned] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* ignore */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return; // don't clobber the stored value before reading it
    try {
      localStorage.setItem(STORAGE_KEY, String(pinned));
    } catch {
      /* ignore */
    }
  }, [pinned, restored]);

  return (
    <div className={`app-shell ${pinned ? "app-shell--dock-pinned" : ""}`}>
      <Dock
        pinned={pinned}
        isAdmin={isAdmin}
        onTogglePin={() => setPinned((v) => !v)}
      />
      <div className="app-main">
        <TopBar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
