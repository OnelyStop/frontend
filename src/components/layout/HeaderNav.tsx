"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NAV_GROUPS, type NavGroup } from "@/data/navigation";

/* Header navigation. The app has no sidebar, so this and ⌘K are the only ways
   round it — every screen has to be reachable from here without typing. */

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
    // On document, not window: the running head's Esc handler walks a level up
    // the URL, and closing an open menu has to win over that.
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

        return (
          <div key={g.id} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.id)}
              className={`rounded-pill hover:text-ink flex h-9 items-center gap-1 px-3 text-[14px] transition-colors ${
                live || isOpen ? "text-ink" : "text-ink-2"
              }`}
            >
              {g.label}
              <ChevronDown
                size={13}
                className={`text-ink-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
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
