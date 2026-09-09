"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/design-system";
import { AVATARS, AVATAR_KEYS, type AvatarKey } from "../avatars";

// null is a real choice, not an empty state: it keeps the initials monogram.
export function AvatarPicker({
  value,
  onChange,
  initials,
}: {
  value: AvatarKey | null;
  onChange: (next: AvatarKey | null) => void;
  initials: string;
}) {
  const options: (AvatarKey | null)[] = [null, ...AVATAR_KEYS];

  return (
    <div
      role="radiogroup"
      aria-label="Avatar"
      className="flex flex-wrap items-center gap-2.5"
    >
      {options.map((option) => {
        const selected = option === value;
        const label = option ? AVATARS[option].label : "No avatar";
        return (
          <button
            key={option ?? "none"}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(option)}
            className={`press ease-soft relative grid size-11 place-items-center rounded-full transition-[box-shadow,transform] duration-200 ${
              selected
                ? "ring-ink ring-2 ring-offset-2"
                : "ring-line-2 hover:ring-ink/25 ring-1"
            }`}
          >
            {option ? (
              <Avatar size={44} tint={AVATARS[option].wash}>
                <span style={{ color: AVATARS[option].ink }}>{initials}</span>
              </Avatar>
            ) : (
              <span className="text-ink-3 text-[13px]">{initials}</span>
            )}
            <span
              aria-hidden
              className={`bg-ink ease-soft absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full text-white transition-[opacity,transform] duration-200 ${
                selected
                  ? "opacity-100 motion-safe:scale-100"
                  : "opacity-0 motion-safe:scale-50"
              }`}
            >
              <Check size={10} strokeWidth={3.5} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
