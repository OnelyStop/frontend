"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "../lib/cn";

/** Backdrop, panel, Esc and click-outside. The caller draws its own close button, since some sit in a header and some in the corner. */
export function Modal({
  label,
  onClose,
  className,
  children,
}: {
  label: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    // Capture and stop it dead, or the running head's Esc also fires and walks up the URL behind the modal.
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

  // Above every full-screen layer (the mock sitting and the retrieval slip are z-100): a dialog opened from inside one otherwise renders underneath it.
  return (
    <div
      className="bg-ink/20 fixed inset-0 z-110 grid place-items-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* data-lenis-prevent: Lenis owns the wheel on window, so without it a tall modal only scrolls by dragging its bar. */}
      <div
        role="dialog"
        aria-modal
        aria-label={label}
        data-lenis-prevent
        className={cn(
          "pop-in border-line bg-canvas shadow-pop relative max-h-[85vh] max-w-full rounded-[24px] border",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
