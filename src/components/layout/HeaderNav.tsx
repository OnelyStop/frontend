"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  GraduationCap,
  Inbox,
  Sparkle,
  Target,
  TrendingUp,
} from "lucide-react";
import { NAV_GROUPS, type NavGroup } from "@/data/navigation";

const GROUP_ICON: Record<string, typeof GraduationCap> = {
  learn: GraduationCap,
  practise: Target,
  recall: Inbox,
  grow: TrendingUp,
};

function GroupIcon({ id }: { id: string }) {
  const Icon = GROUP_ICON[id] ?? Sparkle;
  return <Icon size={19} strokeWidth={1.8} />;
}

export function HeaderNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    // On document, not window: closing the menu must beat the running head's Esc.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="hidden items-center gap-0.5 lg:flex">
      {groups.map((g) => {
        const live = g.items.some((i) => pathname.startsWith(i.path));
        const isOpen = open === g.id;
        // Only the group you are in wears its name; the rest are icons, as in the reference.
        const on = live || isOpen;

        return (
          <div key={g.id} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-label={g.label}
              onClick={() => setOpen(isOpen ? null : g.id)}
              className={`rounded-pill hover:text-on-frame flex h-10 items-center gap-2 text-[14px] font-medium transition-colors ${
                on
                  ? "bg-frame-2 text-on-frame px-4"
                  : "text-on-frame-2 justify-center px-3"
              }`}
            >
              <GroupIcon id={g.id} />
              {on ? (
                <>
                  {g.label}
                  <ChevronDown
                    size={13}
                    className={`text-on-frame-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </>
              ) : null}
            </button>

            {isOpen ? (
              <div
                role="menu"
                aria-label={g.label}
                className="border-line bg-canvas shadow-pop absolute top-11 left-0 z-50 w-[320px] rounded-[18px] border p-1.5"
              >
                {g.items.map((i) => {
                  const on = pathname.startsWith(i.path);
                  return (
                    <Link
                      key={i.id}
                      href={i.path}
                      role="menuitem"
                      aria-current={on ? "page" : undefined}
                      className={`rounded-ctl block px-3 py-2.5 transition-colors ${
                        on ? "bg-brand-soft" : "hover:bg-brand-soft"
                      }`}
                    >
                      <span className="block text-[14px]">{i.label}</span>
                      <span className="text-ink-3 mt-0.5 block text-[13px] leading-snug">
                        {i.hint}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export const MAIN_GROUPS = NAV_GROUPS.filter((g) => g.id !== "account");
export const ACCOUNT_GROUP = NAV_GROUPS.find((g) => g.id === "account")!;
