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
      className="border-line bg-canvas shadow-pop fixed inset-y-0 right-0 z-90 flex w-[380px] max-w-[92vw] flex-col border-l"
    >
      <header className="border-line flex h-16 shrink-0 items-center gap-2 border-b px-5">
        <Sparkles size={15} strokeWidth={2} className="text-brand" />
        <span className="text-[14px]">Ask Onely</span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={close}
          aria-label="Close Ask Onely"
          className="rounded-ctl text-ink-3 hover:bg-line hover:text-ink grid size-8 place-items-center transition-colors"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      {selection ? (
        <blockquote className="border-brand bg-brand-soft/50 text-ink-2 mx-5 mt-4 shrink-0 border-l-2 py-2 pr-2 pl-3 text-[13px] leading-relaxed">
          {selection}
        </blockquote>
      ) : null}

      <div
        ref={logRef}
        data-lenis-prevent
        className="flex-1 space-y-3 overflow-y-auto p-5"
      >
        {messages.length === 0 && !busy ? (
          <p className="text-ink-3 text-[13px] leading-relaxed">
            Ask anything about the selected passage — what it means, why it
            earns marks, or how the examiner reads it.
          </p>
        ) : null}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
              m.role === "user"
                ? "bg-brand ml-6 text-white"
                : "bg-canvas text-ink-2 ring-line ring-1"
            }`}
          >
            {m.content}
          </div>
        ))}

        {busy ? (
          <div
            aria-live="polite"
            className="bg-canvas text-ink-3 ring-line rounded-[14px] px-3.5 py-2.5 text-[14px] ring-1"
          >
            Onely is thinking…
          </div>
        ) : null}

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
          className="rounded-ctl bg-ink hover:bg-ink/90 mt-2 h-9 w-full text-[14px] font-medium text-white transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
