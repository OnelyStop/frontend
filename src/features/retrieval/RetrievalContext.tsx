"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RetrievalState = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const RetrievalContext = createContext<RetrievalState | null>(null);

export function RetrievalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <RetrievalContext.Provider value={value}>
      {children}
    </RetrievalContext.Provider>
  );
}

export function useRetrieval() {
  const ctx = useContext(RetrievalContext);
  if (!ctx)
    throw new Error("useRetrieval must be used within RetrievalProvider");
  return ctx;
}
