"use client";

import { Bell, Grid2x2, LayoutList, Minus, Plus, Workflow } from "lucide-react";
import { cn } from "@/design-system";

export type RailView = "canvas" | "list" | "grid";

const VIEWS = [
  { id: "canvas" as const, icon: Workflow, label: "Canvas view" },
  { id: "list" as const, icon: LayoutList, label: "List view" },
  { id: "grid" as const, icon: Grid2x2, label: "Grid view" },
];

// Chrome, not content — it holds only what applies on every route.
export function CanvasRail({
  view = "canvas",
  onView,
  unread = 0,
}: {
  view?: RailView;
  onView?: (v: RailView) => void;
  unread?: number;
}) {
  return (
    <aside
      aria-label="Canvas controls"
      className="sticky top-28 hidden h-fit flex-col items-center gap-3.5 lg:flex"
    >
      {VIEWS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={view === id}
          onClick={() => onView?.(id)}
          className={cn(
            "press shadow-card grid size-13 place-items-center rounded-full",
            view === id ? "bg-frame text-white" : "bg-canvas text-ink",
          )}
        >
          <Icon size={20} strokeWidth={1.8} />
        </button>
      ))}

      <span className="h-40" aria-hidden />

      <div className="relative">
        {unread > 0 ? (
          <span className="bg-ok-soft text-ok tnum absolute -top-1 -left-2 z-2 rounded-full px-2 py-0.5 text-[11.5px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        <button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="press bg-canvas text-ink shadow-card grid size-13 place-items-center rounded-full"
        >
          <Bell size={20} strokeWidth={1.8} />
        </button>
      </div>

      <button
        type="button"
        aria-label="Zoom in"
        className="press bg-canvas text-ink shadow-card grid size-13 place-items-center rounded-full"
      >
        <Plus size={20} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        className="press bg-canvas text-ink shadow-card grid size-13 place-items-center rounded-full"
      >
        <Minus size={20} strokeWidth={1.8} />
      </button>
    </aside>
  );
}
