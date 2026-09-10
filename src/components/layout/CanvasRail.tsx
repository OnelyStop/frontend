"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Map, NotebookPen } from "lucide-react";
import { cn } from "@/design-system";

// Everything else lives in the nav; the rail is the few you reach for mid-session.
const SHORTCUTS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/attempt-map", label: "Attempt map", icon: Map },
  { href: "/notes", label: "Notes", icon: NotebookPen },
];

export function CanvasRail({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const here = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const disc = (on: boolean) =>
    cn(
      "press shadow-card grid size-11 place-items-center rounded-full",
      on ? "bg-frame text-white" : "bg-canvas text-ink-2 hover:text-ink",
    );

  return (
    <aside
      aria-label="Shortcuts"
      className="sticky top-6 hidden h-[calc(100svh-9rem)] flex-col items-center gap-2.5 lg:flex"
    >
      {SHORTCUTS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={label}
          aria-label={label}
          aria-current={here(href) ? "page" : undefined}
          className={disc(here(href))}
        >
          <Icon size={18} strokeWidth={1.8} />
        </Link>
      ))}

      <div className="relative mt-auto mb-19">
        {unread > 0 ? (
          <span className="bg-bad text-canvas tnum absolute -top-1 -right-1 z-2 grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        <Link
          href="/notifications"
          title="Notifications"
          aria-label={
            unread ? `Notifications, ${unread} unread` : "Notifications"
          }
          aria-current={here("/notifications") ? "page" : undefined}
          className={disc(here("/notifications"))}
        >
          <Bell size={18} strokeWidth={1.8} />
        </Link>
      </div>
    </aside>
  );
}
