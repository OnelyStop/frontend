"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { Rationale } from "@/design-system";
import { useCompanion } from "./CompanionContext";

const DOCK_KEY = "onely.companion.dock";

export function CompanionPanel() {
  const { open, selection, messages, busy, error, ask, close } = useCompanion();
  const [draft, setDraft] = useState("");
  // false = a floating card in the corner; true = docked full-height sidebar.
  const [docked, setDocked] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setDocked(localStorage.getItem(DOCK_KEY) === "1");
    } catch {
      /* private mode — default to the card */
    }
  }, []);

  const setDock = (next: boolean) => {
    setDocked(next);
    try {
      localStorage.setItem(DOCK_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, selection]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  // Esc closes the panel, not the running head walking up the URL.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, close]);

  if (!open) return null;

  const send = () => {
    const q = draft.trim();
    if (!q || busy) return;
    setDraft("");
    void ask(q);
  };

  return (
    <aside
      aria-label="Ask Onely"
      className={`pop-in bg-canvas border-line shadow-pop ease-soft fixed right-0 bottom-0 z-90 flex w-95 max-w-[92vw] flex-col border transition-[height,right,bottom,border-radius,border-width] duration-300 ${
        docked
          ? "h-dvh rounded-none border-y-0 border-r-0"
          : "right-4 bottom-4 h-[min(620px,calc(100dvh-2rem))] rounded-xl"
      }`}
    >
      <header className="border-line flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Sparkles size={15} strokeWidth={2} className="text-brand" />
        <span className="text-[14px]">Ask Onely</span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setDock(!docked)}
          aria-label={docked ? "Float in the corner" : "Dock to the side"}
          title={docked ? "Float in the corner" : "Dock to the side"}
          className="press rounded-ctl text-ink-3 hover:bg-line hover:text-ink grid size-8 place-items-center"
        >
          {docked ? (
            <Minimize2 size={15} strokeWidth={1.75} />
          ) : (
            <Maximize2 size={15} strokeWidth={1.75} />
          )}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close Ask Onely"
          className="press rounded-ctl text-ink-3 hover:bg-line hover:text-ink grid size-8 place-items-center"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      {selection ? (
        <blockquote className="border-brand bg-brand-soft/50 text-ink-2 mx-4 mt-4 shrink-0 border-l-2 py-2 pr-2 pl-3 text-[13px] leading-relaxed">
          {selection}
        </blockquote>
      ) : null}

      <div
        ref={logRef}
        data-lenis-prevent
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && !busy ? (
          <p className="text-ink-3 text-[13px] leading-relaxed">
            Ask anything about the selected passage — what it means, how the
            exam tests it, or the shortcut for it.
          </p>
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="bg-panel text-ink ml-6 rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap"
            >
              {m.content}
            </div>
          ) : (
            <Rationale key={i} className="p-4 whitespace-pre-wrap sm:p-4">
              {m.content}
            </Rationale>
          ),
        )}

        {/* The live region has to be a DOM node: Rationale takes a closed prop list and forwards nothing. */}
        <div aria-live="polite">
          {busy ? (
            <Rationale className="p-4 sm:p-4">Onely is thinking…</Rationale>
          ) : null}
        </div>

        {error ? (
          <p className="bg-bad-soft text-bad rounded-[14px] px-3.5 py-2.5 text-[13px]">
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="border-line shrink-0 border-t p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          rows={2}
          placeholder="Ask about the selection…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="rounded-ctl border-line bg-canvas placeholder:text-ink-4 focus:border-brand focus:bg-canvas w-full resize-none border px-3 py-2 text-[14px] leading-relaxed transition-colors outline-none"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="press rounded-ctl bg-ink hover:bg-ink/90 mt-2 h-9 w-full text-[14px] font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
