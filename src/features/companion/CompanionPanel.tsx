"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  Button,
  ButtonLink,
  Empty,
  IconButton,
  Rationale,
  SectionTitle,
  Textarea,
} from "@/design-system";
import { useCompanion } from "./CompanionContext";

const WHEN = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

// A column on the stage, headed like any other section — not a panel floating over the page.
export function CompanionPanel() {
  const { open, selection, messages, busy, error, ask, close } = useCompanion();
  const [draft, setDraft] = useState("");
  const pathname = usePathname();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, selection]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  // The selection it was opened against is gone once the route changes.
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Esc closes the column, not the running head walking up the URL.
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
      className="border-line sticky top-6 mt-10 flex h-[calc(100svh-11rem)] flex-col lg:mt-0 lg:-ml-1 lg:border-l lg:pl-8"
    >
      <SectionTitle
        aside={
          <IconButton label="Close Ask Onely" onClick={close}>
            <X size={16} strokeWidth={1.75} />
          </IconButton>
        }
      >
        Ask Onely
      </SectionTitle>

      {selection ? (
        <blockquote className="border-line text-ink-3 mb-6 shrink-0 border-l-2 pl-3 text-[13px] leading-relaxed">
          <span className="line-clamp-3">{selection}</span>
        </blockquote>
      ) : null}

      <div
        ref={logRef}
        data-lenis-prevent
        className="-mr-1 flex-1 space-y-7 overflow-y-auto pr-1"
      >
        {/* Opened from the dock with nothing selected: Onely answers about a passage, so say where the passages are. */}
        {!selection ? (
          <Empty
            mark="?"
            tone="brand"
            title="Pick a passage first"
            sub="Select a few words in any topic of the knowledge base and Onely explains what it means, how the exam tests it, and the shortcut for it."
            action={
              <ButtonLink href="/study" size="sm">
                Open the knowledge base
              </ButtonLink>
            }
          />
        ) : messages.length === 0 && !busy ? (
          <Empty
            mark="?"
            tone="brand"
            title="Nothing asked yet"
            sub="What it means, how the exam tests it, or the shortcut for it."
          />
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i}>
              <p className="text-ink-3 mb-1.5 text-[12px]">
                You · {WHEN.format(new Date(m.at))}
              </p>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                {m.content}
              </p>
            </div>
          ) : (
            <Rationale key={i} className="p-5 whitespace-pre-wrap sm:p-5">
              {m.content}
            </Rationale>
          ),
        )}

        {/* The live region has to be a DOM node: Rationale takes a closed prop list and forwards nothing. */}
        <div aria-live="polite">
          {busy ? (
            <Rationale className="p-5 sm:p-5">Onely is thinking…</Rationale>
          ) : null}
        </div>

        {error ? (
          <p className="bg-bad-soft text-bad rounded-ctl px-3.5 py-2.5 text-[13px]">
            {error}
          </p>
        ) : null}
      </div>

      {selection ? (
        <form
          className="mt-4 shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Textarea
            ref={inputRef}
            value={draft}
            rows={2}
            placeholder="Ask about the selection…"
            aria-label="Ask Onely"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={busy || !draft.trim()}
            className="mt-2 w-full"
          >
            Send
          </Button>
        </form>
      ) : null}
    </aside>
  );
}
