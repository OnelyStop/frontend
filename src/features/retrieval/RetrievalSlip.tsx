"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { useRetrieval } from "./RetrievalContext";
import { rank } from "./rank";
import { RAG, RESTING, type Target } from "./targets";

export function RetrievalSlip() {
  const { open, setOpen } = useRetrieval();
  const { signOut } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const typed = query.trim().length > 0;
  const results = typed ? rank(query) : RESTING;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSel(0);
    inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const fire = (t: Target | undefined) => {
    if (!t) return;
    setOpen(false);

    if (t.run === "signout") {
      void signOut().then(() => router.replace("/"));
      return;
    }
    if (t.run === "lamp") {
      const root = document.documentElement;
      if (root.dataset.lamp === "night") delete root.dataset.lamp;
      else root.dataset.lamp = "night";
      return;
    }
    if (t.href) router.push(t.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((i) => (results.length ? (i + 1) % results.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      fire(results[sel]);
    }
  };

  const current = results[sel];

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-ink/25 px-6 pt-[14vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Retrieval"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[600px] overflow-hidden rounded-xl border border-line bg-canvas shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <span
            className="rounded-md bg-line px-1.5 py-0.5 text-[11px] font-medium text-ink-3"
            aria-hidden
          >
            ⌘K
          </span>
          <input
            ref={inputRef}
            value={query}
            placeholder="a topic, a paper, or a verb"
            aria-label="Retrieve"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="slip-results"
            aria-activedescendant={current ? `slip-${current.id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-4"
          />
          {typed ? (
            <span className="tnum text-[12px] text-ink-4">
              {results.length}
            </span>
          ) : null}
        </div>

        {results.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] leading-relaxed text-ink-3">
            Nothing matches that. ⌘K reads your syllabus, your papers, and
            everything you can do.
          </p>
        ) : (
          <div
            id="slip-results"
            role="listbox"
            aria-label="Results"
            className="max-h-[52vh] overflow-y-auto p-2"
          >
            {!typed ? (
              <p className="px-3 pb-1.5 pt-2 text-[13px] text-ink-3">
                Jump to
              </p>
            ) : null}

            {results.map((t, i) => (
              <button
                key={t.id}
                id={`slip-${t.id}`}
                type="button"
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={() => fire(t)}
                className={`flex w-full items-center gap-3 rounded-ctl px-3 py-2.5 text-left transition-colors ${
                  i === sel ? "bg-brand-soft" : "hover:bg-brand-soft/50"
                }`}
              >
                <span className="tnum w-20 shrink-0 truncate text-[11.5px] text-ink-4">
                  {t.code}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[14px] ${i === sel ? "font-medium text-brand" : ""}`}
                >
                  {t.label}
                </span>
                <span className="shrink-0 truncate text-[12px] text-ink-3">
                  {t.detail}
                </span>
                {t.wash && t.wash !== "none" ? (
                  <span className="shrink-0 text-[11px] text-ink-4" aria-hidden>
                    {RAG[t.wash]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-line bg-canvas px-5 py-2.5 text-[12px] text-ink-3">
          <span className="truncate">
            {current ? (
              <>
                <kbd className="mr-1.5 rounded border border-line bg-canvas px-1 py-0.5 text-[11px]">
                  ⏎
                </kbd>
                {current.does}
              </>
            ) : (
              "nothing to open"
            )}
          </span>
          <span className="shrink-0 text-ink-4">↑↓ choose · esc closes</span>
        </div>
      </div>
    </div>
  );
}
