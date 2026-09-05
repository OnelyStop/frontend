import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

/* Form controls. One height (40px), one radius, one focus treatment: the
   border goes to brand. No fills, no rings. */

const CONTROL =
  "w-full rounded-ctl border border-line bg-canvas text-[14px] outline-none transition-colors focus:border-brand disabled:opacity-50";

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
      <label htmlFor={htmlFor} className="text-ink-2 block text-[13px]">
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

export function Select({
  className,
  children,
  ...rest
}: ComponentProps<"select">) {
  return (
    <select className={cn(CONTROL, "h-10 px-3", className)} {...rest}>
      {children}
    </select>
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
        className="accent-brand mt-0.5 size-4 shrink-0"
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

/* Segmented control: a hairline pill group, the live option filled black.
   Used for every in-page filter so a filter never looks like a button. */
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
    <div
      className={cn(
        "rounded-pill border-line inline-flex border p-1",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-pill inline-flex items-center gap-2 px-4 py-1.5 text-[14px] transition-colors duration-150",
            value === o ? "bg-ink text-white" : "text-ink-3 hover:text-ink",
          )}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}
