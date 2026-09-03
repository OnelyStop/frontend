"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
};

type Props<T extends string> = {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (v: T) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: "start" | "end";
};

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  placeholder = "Select…",
  disabled,
  className,
  align = "start",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the active row in view when arrowing past the fold.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const commit = (i: number) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (
      !open &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <label htmlFor={id} className="text-ink-2 mb-1.5 block text-[13px]">
          {label}
        </label>
      ) : null}

      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setActive(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "rounded-ctl border-line bg-canvas flex h-10 w-full items-center gap-2 border px-3.5 text-left text-[14px] transition-colors outline-none",
          "focus:border-brand disabled:opacity-50",
          open && "border-brand",
        )}
      >
        {selected?.icon}
        <span
          className={cn("min-w-0 flex-1 truncate", !selected && "text-ink-4")}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "text-ink-3 shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          data-lenis-prevent
          className={cn(
            "border-line bg-canvas shadow-pop absolute z-50 mt-1.5 max-h-[min(28rem,60vh)] w-full min-w-max overflow-y-auto overscroll-contain rounded-[14px] border p-1.5",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <div
                key={o.value}
                id={`${id}-opt-${i}`}
                data-i={i}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(i)}
                className={cn(
                  "rounded-ctl flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-[14px] transition-colors",
                  i === active && "bg-brand-soft",
                )}
              >
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate",
                      isSel && "text-brand font-medium",
                    )}
                  >
                    {o.label}
                  </span>
                  {o.hint ? (
                    <span className="text-ink-3 block truncate text-[12.5px]">
                      {o.hint}
                    </span>
                  ) : null}
                </span>
                {isSel ? (
                  <Check size={14} className="text-brand shrink-0" />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
