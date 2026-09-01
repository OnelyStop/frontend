"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; body: string; cited?: string[] };

const ERRORS: Record<string, string> = {
  not_found: "This topic conversation could not be started.",
  rate_limited: "You are asking very quickly — give it a moment.",
  unauthorized: "The tutor is not configured on this instance.",
  timeout: "The tutor took too long. Try again.",
};

export function TutorPanel({
  topicSlug,
  selectedBlockKey,
  blockTitles,
  onClose,
}: {
  topicSlug: string;
  selectedBlockKey: string | null;
  blockTitles: Record<string, string>;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const convId = useRef<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedBlockKey]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  // Esc closes the drawer, not the running head walking up the URL.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [onClose]);

  const send = async () => {
    const question = draft.trim();
    if (!question || busy) return;
    setDraft("");
    setError(null);
    setMessages((m) => [...m, { role: "user", body: question }]);
    setBusy(true);
    try {
      if (!convId.current) {
        const res = await fetch("/api/study/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicSlug }),
        });
        const data = (await res.json()) as {
          conversation?: { id: string };
          error?: string;
        };
        if (!res.ok || !data.conversation) {
          setError(ERRORS[data.error ?? ""] ?? "Could not start the tutor.");
          setBusy(false);
          return;
        }
        convId.current = data.conversation.id;
      }

      const res = await fetch(
        `/api/study/chat/conversations/${convId.current}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            selectedBlockKey,
            includeMyNotes: includeNotes,
          }),
        },
      );
      const data = (await res.json()) as {
        answer?: string;
        citedBlockKeys?: string[];
        error?: string;
      };
      if (!res.ok || !data.answer) {
        setError(
          ERRORS[data.error ?? ""] ?? "The tutor could not answer that.",
        );
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", body: data.answer!, cited: data.citedBlockKeys },
      ]);
    } catch {
      setError("Could not reach the tutor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      aria-label="Ask the tutor"
      className="border-line bg-canvas shadow-pop fixed inset-y-0 right-0 z-90 flex w-[390px] max-w-[92vw] flex-col border-l"
    >
      <header className="border-line flex h-16 shrink-0 items-center gap-2 border-b px-5">
        <Sparkles size={15} strokeWidth={2} className="text-brand" />
        <span className="text-[14px]">Tutor</span>
        <span className="flex-1" />
        <button
          onClick={onClose}
          aria-label="Close tutor"
          className="rounded-ctl text-ink-3 hover:bg-line hover:text-ink grid size-8 place-items-center transition-colors"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      {selectedBlockKey ? (
        <p className="border-line text-ink-3 shrink-0 border-b px-5 py-2 text-[12px]">
          Focused on: {blockTitles[selectedBlockKey] ?? selectedBlockKey}
        </p>
      ) : null}

      <div
        ref={logRef}
        data-lenis-prevent
        className="flex-1 space-y-3 overflow-y-auto p-5"
      >
        {messages.length === 0 && !busy ? (
          <p className="text-ink-3 text-[13px] leading-relaxed">
            Ask about anything in this topic. The tutor only sees this
            topic&apos;s material and cites the sections it used.
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
            <p className="whitespace-pre-wrap">{m.body}</p>
            {m.cited && m.cited.length ? (
              <p className="text-ink-4 mt-2 text-[12px]">
                cited:{" "}
                {m.cited.map((k, j) => (
                  <a
                    key={k}
                    href={`#block-${k}`}
                    className="hover:text-brand underline underline-offset-2"
                  >
                    {blockTitles[k] ?? k}
                    {j < m.cited!.length - 1 ? ", " : ""}
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="bg-canvas text-ink-3 ring-line rounded-[14px] px-3.5 py-2.5 text-[14px] ring-1">
            Thinking…
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
          void send();
        }}
      >
        <label className="text-ink-3 mb-2 flex items-center gap-2 text-[12px]">
          <input
            type="checkbox"
            checked={includeNotes}
            onChange={(e) => setIncludeNotes(e.target.checked)}
            className="size-3.5 accent-[#4f46e5]"
          />
          Include my notes in the tutor&apos;s context
        </label>
        <textarea
          ref={inputRef}
          value={draft}
          rows={2}
          maxLength={1000}
          placeholder="Ask a question…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="rounded-ctl border-line bg-canvas placeholder:text-ink-4 focus:border-brand w-full resize-none border px-3 py-2 text-[14px] leading-relaxed outline-none"
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
