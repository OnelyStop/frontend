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
      className="bg-ink/25 fixed inset-0 z-100 flex items-start justify-center px-6 pt-[14vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Retrieval"
        onMouseDown={(e) => e.stopPropagation()}
        className="border-line bg-canvas shadow-pop w-full max-w-[600px] overflow-hidden rounded-xl border"
      >
        <div className="border-line flex items-center gap-3 border-b px-5">
          <span
            className="bg-line text-ink-3 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
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
            className="placeholder:text-ink-4 h-14 flex-1 bg-transparent text-[16px] outline-none"
          />
          {typed ? (
            <span className="tnum text-ink-4 text-[12px]">
              {results.length}
            </span>
          ) : null}
        </div>

        {results.length === 0 ? (
          <p className="text-ink-3 px-5 py-8 text-center text-[13px] leading-relaxed">
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
              <p className="text-ink-3 px-3 pt-2 pb-1.5 text-[13px]">Jump to</p>
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
                className={`rounded-ctl flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === sel ? "bg-brand-soft" : "hover:bg-brand-soft/50"
                }`}
              >
                <span className="tnum text-ink-4 w-20 shrink-0 truncate text-[11.5px]">
                  {t.code}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[14px] ${i === sel ? "text-brand font-medium" : ""}`}
                >
                  {t.label}
                </span>
                <span className="text-ink-3 shrink-0 truncate text-[12px]">
                  {t.detail}
                </span>
                {t.wash && t.wash !== "none" ? (
                  <span className="text-ink-4 shrink-0 text-[11px]" aria-hidden>
                    {RAG[t.wash]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        <div className="border-line bg-canvas text-ink-3 flex items-center justify-between gap-4 border-t px-5 py-2.5 text-[12px]">
          <span className="truncate">
            {current ? (
              <>
                <kbd className="border-line bg-canvas mr-1.5 rounded border px-1 py-0.5 text-[11px]">
                  ⏎
                </kbd>
                {current.does}
              </>
            ) : (
              "nothing to open"
            )}
          </span>
          <span className="text-ink-4 shrink-0">↑↓ choose · esc closes</span>
        </div>
      </div>
    </div>
  );
}
