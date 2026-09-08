"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  ClipboardList,
  Home,
  Layers,
  Map,
  Timer,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/design-system";

// The reference's view toggles and zoom are not built; these all navigate.
const SHORTCUTS = [
  { href: "/home", label: "Today", icon: Home },
  { href: "/mocks", label: "Mocks", icon: ClipboardList },
  { href: "/drills", label: "Drills", icon: Timer },
  { href: "/attempt-map", label: "Attempt map", icon: Map },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/study", label: "Knowledge base", icon: BookOpen },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
];

export function CanvasRail({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Shortcuts"
      className="sticky top-6 hidden h-fit flex-col items-center gap-2.5 lg:flex"
    >
      {SHORTCUTS.map(({ href, label, icon: Icon }) => {
        const on = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={on ? "page" : undefined}
            className={cn(
              "press shadow-card grid size-11 place-items-center rounded-full",
              on
                ? "bg-frame text-white"
                : "bg-canvas text-ink-2 hover:text-ink",
            )}
          >
            <Icon size={18} strokeWidth={1.8} />
          </Link>
        );
      })}

      <div className="relative mt-4">
        {unread > 0 ? (
          <span className="bg-ok-soft text-ok tnum absolute -top-1 -left-2 z-2 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        <Link
          href="/notes"
          title="Notes"
          aria-label={`Notes${unread ? `, ${unread} unread` : ""}`}
          className="press bg-canvas text-ink-2 hover:text-ink shadow-card grid size-11 place-items-center rounded-full"
        >
          <Bell size={18} strokeWidth={1.8} />
        </Link>
      </div>
    </aside>
  );
}
