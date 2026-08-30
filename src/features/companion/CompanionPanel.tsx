"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useCompanion } from "./CompanionContext";

export function CompanionPanel() {
  const { open, selection, messages, busy, error, ask, close } = useCompanion();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, selection]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

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
      className="fixed inset-y-0 right-0 z-90 flex w-[380px] max-w-[92vw] flex-col border-l border-line bg-canvas shadow-pop"
    >
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-5">
        <Sparkles size={15} strokeWidth={2} className="text-brand" />
        <span className="text-[14px]">Ask Onely</span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={close}
          aria-label="Close Ask Onely"
          className="grid size-8 place-items-center rounded-ctl text-ink-3 transition-colors hover:bg-line hover:text-ink"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      {selection ? (
        <blockquote className="mx-5 mt-4 shrink-0 border-l-2 border-brand bg-brand-soft/50 py-2 pl-3 pr-2 text-[13px] leading-relaxed text-ink-2">
          {selection}
        </blockquote>
      ) : null}

      <div
        ref={logRef}
        data-lenis-prevent
        className="flex-1 space-y-3 overflow-y-auto p-5"
      >
        {messages.length === 0 && !busy ? (
          <p className="text-[13px] leading-relaxed text-ink-3">
            Ask anything about the selected passage — what it means, why it
            earns marks, or how the examiner reads it.
          </p>
        ) : null}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
              m.role === "user"
                ? "ml-6 bg-brand text-white"
                : "bg-canvas text-ink-2 ring-1 ring-line"
            }`}
          >
            {m.content}
          </div>
        ))}

        {busy ? (
          <div
            aria-live="polite"
            className="rounded-[14px] bg-canvas px-3.5 py-2.5 text-[14px] text-ink-3 ring-1 ring-line"
          >
            Onely is thinking…
          </div>
        ) : null}

        {error ? (
          <p className="rounded-[14px] bg-bad-soft px-3.5 py-2.5 text-[13px] text-bad">
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="shrink-0 border-t border-line p-4"
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
          className="w-full resize-none rounded-ctl border border-line bg-canvas px-3 py-2 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-ink-4 focus:border-brand focus:bg-canvas"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="mt-2 h-9 w-full rounded-ctl bg-ink text-[14px] font-medium text-white transition-colors hover:bg-ink/90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
