import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import "./Dropdown.css";

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
};

type DropdownProps<T extends string> = {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  menuClassName?: string;
};

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  menuClassName = "",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`dd ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="dd__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dd__value">{selected}</span>
        <ChevronDown size={14} strokeWidth={2} className="dd__chevron" />
      </button>
      {open && (
        <ul className={`dd__menu ${menuClassName}`.trim()} role="listbox" id={listId}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`dd__option ${active ? "dd__option--active" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {active && <Check size={14} strokeWidth={2.25} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type MenuPanelProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  width?: number;
};

export function MenuPanel({
  open,
  onClose,
  children,
  className = "",
  width = 280,
}: MenuPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`dd__menu dd__menu--panel ${className}`.trim()}
      ref={rootRef}
      style={{ width }}
      role="menu"
    >
      {children}
    </div>
  );
}
