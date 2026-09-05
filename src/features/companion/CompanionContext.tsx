"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CompanionMessage = { role: "user" | "assistant"; content: string };

type CompanionState = {
  open: boolean;
  selection: string | null;
  messages: CompanionMessage[];
  busy: boolean;
  error: string | null;
  openWith: (selection: string) => void;
  ask: (question: string) => Promise<void>;
  close: () => void;
};

const CompanionContext = createContext<CompanionState | null>(null);

const ERRORS: Record<string, string> = {
  unauthorized: "Your session has expired. Sign in again to ask.",
  not_configured: "Ask Onely isn't configured on this instance yet.",
  rate_limited: "Onely is busy right now — try again in a moment.",
};

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<string | null>(null);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openWith = useCallback((text: string) => {
    setSelection(text);
    // A new selection starts a new conversation about that passage.
    setMessages([]);
    setError(null);
    setOpen(true);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      if (!selection || busy) return;
      const next: CompanionMessage[] = [
        ...messages,
        { role: "user", content: question },
      ];
      setMessages(next);
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selection,
            question,
            history: messages,
          }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || !data.text) {
          setError(
            ERRORS[data.error ?? ""] ??
              "Onely couldn't answer that. Try again.",
          );
          return;
        }
        setMessages([...next, { role: "assistant", content: data.text }]);
      } catch {
        setError("Onely couldn't be reached. Check your connection.");
      } finally {
        setBusy(false);
      }
    },
    [selection, messages, busy],
  );

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, selection, messages, busy, error, openWith, ask, close }),
    [open, selection, messages, busy, error, openWith, ask, close],
  );

  return (
    <CompanionContext.Provider value={value}>
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error("useCompanion outside CompanionProvider");
  return ctx;
}
