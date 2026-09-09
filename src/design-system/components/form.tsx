import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

// Recessed grey that lifts to white paper on focus; the hairline-on-white was the old language.
const CONTROL =
  "w-full rounded-ctl bg-panel text-ink placeholder:text-ink-4 text-[14px] outline-none transition-[background-color,box-shadow] duration-200 ease-[var(--ease-swift)] focus:bg-canvas focus:shadow-card disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="text-ink-2 block text-[13px] font-medium"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="text-bad mt-1.5 text-[13px]">{error}</p>
      ) : hint ? (
        <p className="text-ink-3 mt-1.5 text-[13px]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-10 px-3.5", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        CONTROL,
        "resize-none px-3.5 py-2.5 leading-relaxed",
        className,
      )}
      {...rest}
    />
  );
}

export function Checkbox({
  label,
  hint,
  className,
  ...rest
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 transition-colors",
        className,
      )}
    >
      <input
        type="checkbox"
        className="accent-brand rounded-ctl mt-0.5 size-4.5 shrink-0"
        {...rest}
      />
      <span>
        <span className="block text-[14px]">{label}</span>
        {hint ? (
          <span className="text-ink-3 mt-0.5 block text-[13px] leading-relaxed">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

// Used for every in-page filter so a filter never looks like a button.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  labels,
  className,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  // ReactNode, not string: the billing toggle puts a Badge inside a pill.
  labels?: Record<string, ReactNode>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-pill bg-panel inline-flex p-1", className)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-pill inline-flex items-center gap-2 px-4 py-1.5 text-[14px] transition-colors duration-150",
            value === o
              ? "bg-canvas text-ink shadow-xs"
              : "text-ink-3 hover:text-ink",
          )}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}
