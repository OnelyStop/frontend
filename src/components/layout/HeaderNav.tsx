"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  GraduationCap,
  Inbox,
  Sparkle,
  Target,
  TrendingUp,
} from "lucide-react";
import { MenuRow, Popover } from "@/design-system";
import { NAV_GROUPS, type NavGroup } from "@/data/navigation";

const GROUP_ICON: Record<string, typeof GraduationCap> = {
  learn: GraduationCap,
  practise: Target,
  recall: Inbox,
  grow: TrendingUp,
};

function GroupIcon({ id }: { id: string }) {
  const Icon = GROUP_ICON[id] ?? Sparkle;
  return <Icon size={20} strokeWidth={1.8} />;
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
              data-nav-active={live ? "" : undefined}
              onClick={() => setOpen(isOpen ? null : g.id)}
              className={`rounded-pill hover:text-on-frame flex h-9.5 items-center gap-2 text-[13px] font-medium transition-colors ${
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
                    size={14}
                    className={`text-on-frame-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </>
              ) : null}
            </button>

            {isOpen ? (
              <Popover label={g.label} width={272} className="top-10.5">
                {g.items.map((i) => (
                  <MenuRow
                    key={i.id}
                    href={i.path}
                    label={i.label}
                    hint={i.hint}
                    current={pathname.startsWith(i.path)}
                  />
                ))}
              </Popover>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export const MAIN_GROUPS = NAV_GROUPS.filter((g) => g.id !== "account");
export const ACCOUNT_GROUP = NAV_GROUPS.find((g) => g.id === "account")!;
