"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { NoteColor, StudyNote } from "../types";

const COLORS: { key: NoteColor; swatch: string }[] = [
  { key: "yellow", swatch: "#facc15" },
  { key: "blue", swatch: "#60a5fa" },
  { key: "green", swatch: "#4ade80" },
  { key: "pink", swatch: "#f472b6" },
];

const MAX = 10_000;

export function NotesPanel({
  topicId,
  contentVersion,
  anchorBlockKey,
  blockTitles,
  notes,
  onChange,
  onClose,
}: {
  topicId: string;
  contentVersion: number;
  anchorBlockKey: string | null;
  blockTitles: Record<string, string>;
  notes: StudyNote[];
  onChange: (next: StudyNote[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState<NoteColor>("yellow");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const create = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/topics/${topicId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyMarkdown: body,
          color,
          blockStableKey: anchorBlockKey,
          contentVersion,
        }),
      });
      const data = (await res.json()) as { note?: StudyNote; error?: string };
      if (!res.ok || !data.note) {
        setError(data.error ?? "Could not save the note.");
        return;
      }
      onChange([...notes, data.note]);
      setDraft("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const removeNote = async (id: string) => {
    const res = await fetch(`/api/study/notes/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 404)
      onChange(notes.filter((n) => n.id !== id));
  };

  const patchNote = async (
    id: string,
    patch: { bodyMarkdown?: string; color?: NoteColor },
    expectedUpdatedAt: string,
  ): Promise<StudyNote | null> => {
    const res = await fetch(`/api/study/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, expectedUpdatedAt }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { note: StudyNote };
    return data.note;
  };

  return (
    <aside
      aria-label="Notes"
      className="border-line bg-canvas shadow-pop fixed inset-y-0 right-0 z-90 flex w-[390px] max-w-[92vw] flex-col border-l"
    >
      <header className="border-line flex h-16 shrink-0 items-center gap-2 border-b px-5">
        <span className="text-[14px]">Notes</span>
        <span className="text-ink-4 text-[12px]">private</span>
        <span className="flex-1" />
        <button
          onClick={onClose}
          aria-label="Close notes"
          className="rounded-ctl text-ink-3 hover:bg-line hover:text-ink grid size-8 place-items-center transition-colors"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </header>

      <div className="border-line shrink-0 border-b p-4">
        {anchorBlockKey ? (
          <p className="text-ink-3 mb-2 text-[12px]">
            Anchored to: {blockTitles[anchorBlockKey] ?? anchorBlockKey}
          </p>
        ) : (
          <p className="text-ink-3 mb-2 text-[12px]">Anchored to the topic</p>
        )}
        <textarea
          value={draft}
          maxLength={MAX}
          rows={3}
          placeholder="Write a note — formula, trap, mnemonic…"
          onChange={(e) => setDraft(e.target.value)}
          className="rounded-ctl border-line bg-canvas placeholder:text-ink-4 focus:border-brand w-full resize-none border px-3 py-2 text-[14px] leading-relaxed outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => setColor(c.key)}
                aria-label={c.key}
                className={`size-5 rounded-full transition-transform ${
                  color === c.key ? "ring-ink scale-110 ring-2" : ""
                }`}
                style={{ background: c.swatch }}
              />
            ))}
          </div>
          <button
            onClick={create}
            disabled={busy || !draft.trim()}
            className="rounded-pill bg-ink hover:bg-ink/85 h-8 px-4 text-[13px] text-white transition-colors disabled:opacity-40"
          >
            Save
          </button>
        </div>
        {error ? <p className="text-bad mt-2 text-[12px]">{error}</p> : null}
      </div>

      <div data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <p className="text-ink-3 text-[13px] leading-relaxed">
            No notes yet. Notes are private to you and stay attached to this
            topic.
          </p>
        ) : (
          notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              blockTitle={
                n.blockStableKey ? blockTitles[n.blockStableKey] : undefined
              }
              onDelete={() => removeNote(n.id)}
              onPatched={(updated) =>
                onChange(notes.map((x) => (x.id === updated.id ? updated : x)))
              }
              patchNote={patchNote}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function NoteCard({
  note,
  blockTitle,
  onDelete,
  onPatched,
  patchNote,
}: {
  note: StudyNote;
  blockTitle?: string;
  onDelete: () => void;
  onPatched: (n: StudyNote) => void;
  patchNote: (
    id: string,
    patch: { bodyMarkdown?: string; color?: NoteColor },
    expectedUpdatedAt: string,
  ) => Promise<StudyNote | null>;
}) {
  const [text, setText] = useState(note.bodyMarkdown);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "stale">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(note);
  latest.current = note;

  useEffect(() => {
    if (text === latest.current.bodyMarkdown) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(async () => {
      const updated = await patchNote(
        note.id,
        { bodyMarkdown: text },
        latest.current.updatedAt,
      );
      if (updated) {
        onPatched(updated);
        setStatus("saved");
      } else {
        setStatus("stale");
      }
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, note.id, patchNote, onPatched]);

  const swatch =
    COLORS.find((c) => c.key === note.color)?.swatch ?? COLORS[0].swatch;

  return (
    <article className="border-line rounded-ctl border p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ background: swatch }}
        />
        <span className="text-ink-4 min-w-0 flex-1 truncate text-[11px]">
          {blockTitle ?? "topic note"}
        </span>
        <span className="text-ink-4 text-[11px]">
          {status === "saving"
            ? "saving…"
            : status === "saved"
              ? "saved"
              : status === "stale"
                ? "reopen to edit"
                : ""}
        </span>
        <button
          onClick={onDelete}
          className="text-ink-4 hover:text-bad text-[11px] transition-colors"
        >
          Delete
        </button>
      </div>
      <textarea
        value={text}
        maxLength={MAX}
        rows={Math.min(8, Math.max(2, text.split("\n").length))}
        onChange={(e) => setText(e.target.value)}
        className="text-ink-2 w-full resize-none bg-transparent text-[13.5px] leading-relaxed outline-none"
      />
    </article>
  );
}
