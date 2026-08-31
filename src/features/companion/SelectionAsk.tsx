"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useCompanion } from "./CompanionContext";

const MIN_LENGTH = 8;

/**
 * Watches for text selections inside any element marked `data-companion` and
 * floats an "Ask Onely" button beside them. Selection is read on mouseup and
 * keyup rather than selectionchange, which fires per-character while dragging.
 */
export function SelectionAsk() {
  const { openWith } = useCompanion();
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const textRef = useRef("");

  useEffect(() => {
    const read = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!sel || sel.isCollapsed || text.length < MIN_LENGTH) {
        setAnchor(null);
        return;
      }
      const node = sel.anchorNode;
      const host =
        node instanceof Element ? node : node?.parentElement ?? null;
      if (!host?.closest("[data-companion]")) {
        setAnchor(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      textRef.current = text;
      setAnchor({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };

    const clear = (e: MouseEvent) => {
      // Let the button's own click land before the selection collapses.
      if ((e.target as Element | null)?.closest(".ask-onely")) return;
      setAnchor(null);
    };

    document.addEventListener("mouseup", read);
    document.addEventListener("keyup", read);
    document.addEventListener("mousedown", clear);
    window.addEventListener("scroll", () => setAnchor(null), true);
    return () => {
      document.removeEventListener("mouseup", read);
      document.removeEventListener("keyup", read);
      document.removeEventListener("mousedown", clear);
    };
  }, []);

  if (!anchor) return null;

  return (
    <button
      type="button"
      className="press fixed z-90 flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-pill bg-ink px-3 py-1.5 text-[12.5px] font-medium text-white shadow-pop"
      style={{ left: anchor.x, top: anchor.y }}
      onClick={() => {
        openWith(textRef.current);
        setAnchor(null);
        window.getSelection()?.removeAllRanges();
      }}
    >
      <Sparkles size={13} strokeWidth={2} />
      Ask Onely
    </button>
  );
}
