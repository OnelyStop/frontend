"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { INDICATOR_OUT, INDICATOR_SPRING, SURFACE } from "../lib/motion";

/* whileTap rather than the `.press` CSS utility: it cancels cleanly on a drag-off, and mis-taps are routine on a 100-question paper. */

export function OptionRow({
  label,
  children,
  selected,
  onSelect,
  className,
}: {
  label: string;
  children: ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      transition={SURFACE}
      className={cn(
        "rounded-ctl flex items-center gap-3.5 border px-4 py-3.5 text-left text-[15px] transition-colors duration-150 ease-[var(--ease-swift)]",
        selected
          ? "border-brand bg-brand-soft"
          : "border-line bg-canvas hover:border-line-2",
        className,
      )}
    >
      <motion.span
        animate={{ scale: selected ? 1 : 0.92 }}
        transition={selected ? INDICATOR_SPRING : INDICATOR_OUT}
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-[13px] transition-colors duration-150 ease-[var(--ease-swift)]",
          selected ? "bg-brand text-white" : "bg-line text-ink-3",
        )}
      >
        {label}
      </motion.span>
      {children}
    </motion.button>
  );
}
