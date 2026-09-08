"use client";

import { Check } from "lucide-react";
import { PASSWORD_RULES } from "../password-rules";

// grid-rows 0fr -> 1fr is the one way to transition to a height you cannot name.
export function PasswordChecklist({
  value,
  open,
}: {
  value: string;
  open: boolean;
}) {
  return (
    <div
      aria-hidden={!open}
      className={`ease-soft grid transition-[grid-template-rows,opacity] duration-300 ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <ul className="overflow-hidden">
        <li aria-hidden className="h-2" />
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li
              key={rule.id}
              className={`ease-soft flex items-center gap-2 py-[3px] text-[12.5px] transition-colors duration-200 ${
                met ? "text-ink-2" : "text-ink-3"
              }`}
            >
              <span className="relative grid size-4 shrink-0 place-items-center">
                <span
                  className={`ease-soft absolute inset-0 rounded-full border transition-[background-color,border-color,transform] duration-200 ${
                    met
                      ? "border-ok bg-ok motion-safe:scale-100"
                      : "border-line-2 motion-safe:scale-90"
                  }`}
                />
                <Check
                  size={10}
                  strokeWidth={3.5}
                  className={`ease-soft relative text-white transition-[opacity,transform] duration-200 ${
                    met
                      ? "opacity-100 motion-safe:scale-100"
                      : "opacity-0 motion-safe:scale-50"
                  }`}
                />
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
