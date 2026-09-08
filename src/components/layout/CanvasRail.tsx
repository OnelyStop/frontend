"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home } from "lucide-react";
import { cn } from "@/design-system";

// Only what works: the reference's view toggles and zoom are not built here.
export function CanvasRail({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const home = pathname === "/home";

  return (
    <aside
      aria-label="Shortcuts"
      className="sticky top-6 hidden h-fit flex-col items-center gap-3 lg:flex"
    >
      <Link
        href="/home"
        aria-label="Today"
        aria-current={home ? "page" : undefined}
        className={cn(
          "press shadow-card grid size-12 place-items-center rounded-full",
          home ? "bg-frame text-white" : "bg-canvas text-ink",
        )}
      >
        <Home size={19} strokeWidth={1.8} />
      </Link>

      <div className="relative mt-2">
        {unread > 0 ? (
          <span className="bg-ok-soft text-ok tnum absolute -top-1 -left-2 z-2 rounded-full px-2 py-0.5 text-[11px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        <Link
          href="/notes"
          aria-label={`Notes${unread ? `, ${unread} unread` : ""}`}
          className="press bg-canvas text-ink shadow-card grid size-12 place-items-center rounded-full"
        >
          <Bell size={19} strokeWidth={1.8} />
        </Link>
      </div>
    </aside>
  );
}
