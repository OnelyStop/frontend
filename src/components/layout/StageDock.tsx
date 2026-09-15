"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  Inbox,
  Layers,
  Map,
  Newspaper,
  NotebookPen,
  PenLine,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/design-system";
import { NAV_GROUPS } from "@/data/navigation";
import { useCompanion } from "@/features/companion/CompanionContext";

const GROUP_ICON: Record<string, LucideIcon> = {
  learn: GraduationCap,
  practise: Target,
  recall: Inbox,
  grow: TrendingUp,
};

const ITEM: Record<string, { icon: LucideIcon; tint: string }> = {
  "attempt-map": { icon: Map, tint: "bg-ga-soft text-ga" },
  mocks: { icon: FileText, tint: "bg-quant-soft text-quant" },
  drills: { icon: Zap, tint: "bg-reasoning-soft text-reasoning" },
  "current-affairs": { icon: Newspaper, tint: "bg-english-soft text-english" },
  flashcards: { icon: Layers, tint: "bg-computer-soft text-computer" },
  notes: { icon: NotebookPen, tint: "bg-warn-soft text-warn" },
  progress: { icon: TrendingUp, tint: "bg-ok-soft text-ok" },
  descriptive: { icon: PenLine, tint: "bg-brand-soft text-brand" },
  community: { icon: Users, tint: "bg-info-soft text-info" },
};

// The header's own groups, so the phone reaches every screen the desktop nav does. Today has its own button, so it is not listed twice.
const GROUPS = NAV_GROUPS.filter((g) => g.id !== "account").map((g) => ({
  ...g,
  items: g.items.filter((i) => i.path !== "/today"),
}));

const SPRING = { type: "spring", stiffness: 520, damping: 38 } as const;

const BUTTON =
  "relative grid size-11 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70";

// One pill shared by every button through layoutId, so moving between screens slides it rather than swapping it.
function Pill() {
  return (
    <motion.span
      layoutId="dock-pill"
      transition={SPRING}
      className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgb(0_0_0/0.25)]"
    />
  );
}

function Glyph({ icon: Icon, on }: { icon: LucideIcon; on: boolean }) {
  return (
    <Icon
      size={20}
      strokeWidth={on ? 2.1 : 1.8}
      className={cn(
        "relative transition-colors duration-200",
        on ? "text-frame" : "text-white/65",
      )}
    />
  );
}

function useHideOnScroll(pinned: boolean) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (pinned) return setHidden(false);
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 80;
      // A few pixels of slack, so the jitter at the end of a flick does not flash the dock.
      if (Math.abs(y - last.current) < 6) return;
      setHidden(y > last.current && y > 120 && !nearBottom);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pinned]);

  return hidden;
}

export function StageDock() {
  const pathname = usePathname();
  const { openWith } = useCompanion();
  const [open, setOpen] = useState<string | null>(null);
  const hidden = useHideOnScroll(open !== null);
  const here = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => setOpen(null), [pathname]);

  // The effect above only fires on a new pathname, so a link to the page already open has to close the sheet itself; it also skips Next re-fetching that page.
  const follow = (href: string) => (e: MouseEvent) => {
    setOpen(null);
    if (pathname === href) e.preventDefault();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const sheet = GROUPS.find((g) => g.id === open);

  return (
    <>
      {/* A sibling, not a wrapper: wrapping the dock would make it the sticky container and pin the dock in place. */}
      <AnimatePresence>
        {sheet ? (
          <motion.button
            type="button"
            aria-label="Close menu"
            className="bg-frame/15 fixed inset-0 z-7 cursor-default backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          />
        ) : null}
      </AnimatePresence>

      <motion.nav
        aria-label="Sections"
        animate={{ y: hidden ? 110 : 0, opacity: hidden ? 0 : 1 }}
        transition={SPRING}
        className="sticky bottom-5 z-8 flex items-center gap-1 self-center rounded-full border border-white/10 bg-[rgb(19_19_22/0.86)] p-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl sm:gap-1.5 lg:hidden"
      >
        <AnimatePresence>
          {sheet ? (
            <motion.div
              key={sheet.id}
              role="menu"
              aria-label={sheet.label}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={SPRING}
              style={{ transformOrigin: "bottom center", x: "-50%" }}
              className="bg-canvas border-line absolute bottom-full left-1/2 mb-3 w-[min(340px,calc(100vw-2rem))] rounded-[24px] border p-2 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.35)]"
            >
              <p className="text-ink-3 px-3 pt-2 pb-1.5 text-[11.5px] font-semibold tracking-[0.08em] uppercase">
                {sheet.label}
              </p>
              {sheet.items.map((i, n) => {
                const look = ITEM[i.id] ?? { icon: Target, tint: "bg-panel" };
                const on = here(i.path);
                return (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.03 * n }}
                  >
                    <Link
                      href={i.path}
                      role="menuitem"
                      aria-current={on ? "page" : undefined}
                      onClick={follow(i.path)}
                      className={cn(
                        "flex items-center gap-3 rounded-[16px] px-2.5 py-2.5 transition-colors",
                        on ? "bg-panel" : "active:bg-panel",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-[12px]",
                          look.tint,
                        )}
                      >
                        <look.icon size={18} strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-medium">
                          {i.label}
                        </span>
                        <span className="text-ink-3 block truncate text-[12.5px]">
                          {i.hint}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.span whileTap={{ scale: 0.88 }} className="block">
          <Link
            href="/today"
            aria-label="Today"
            title="Today"
            aria-current={here("/today") ? "page" : undefined}
            onClick={follow("/today")}
            className={BUTTON}
          >
            {here("/today") && !open ? <Pill /> : null}
            <Glyph icon={Home} on={here("/today") && !open} />
          </Link>
        </motion.span>

        {GROUPS.map((g) => {
          const Icon = GROUP_ICON[g.id] ?? Target;
          const live = g.items.some((i) => here(i.path));
          const only = g.items.length === 1 ? g.items[0] : null;
          const on = open ? open === g.id : live;

          return (
            <motion.span
              key={g.id}
              whileTap={{ scale: 0.88 }}
              className="block"
            >
              {only ? (
                <Link
                  href={only.path}
                  aria-label={only.label}
                  title={only.label}
                  aria-current={live ? "page" : undefined}
                  onClick={follow(only.path)}
                  className={BUTTON}
                >
                  {on ? <Pill /> : null}
                  <Glyph icon={Icon} on={on} />
                </Link>
              ) : (
                <button
                  type="button"
                  aria-label={g.label}
                  title={g.label}
                  aria-haspopup="menu"
                  aria-expanded={open === g.id}
                  onClick={() => setOpen(open === g.id ? null : g.id)}
                  className={BUTTON}
                >
                  {on ? <Pill /> : null}
                  <Glyph icon={Icon} on={on} />
                  {live && open !== g.id ? (
                    <span
                      aria-hidden
                      className="bg-frame absolute bottom-1.5 size-1 rounded-full"
                    />
                  ) : null}
                </button>
              )}
            </motion.span>
          );
        })}

        <span aria-hidden className="mx-0.5 h-6 w-px bg-white/12" />

        <motion.button
          type="button"
          aria-label="Ask Onely"
          title="Ask Onely"
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            setOpen(null);
            openWith("");
          }}
          className={cn(
            BUTTON,
            "text-brand bg-[linear-gradient(145deg,#f3dcff,#d9c8ff)] shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]",
          )}
        >
          <BookOpen size={18} strokeWidth={2.25} />
        </motion.button>
      </motion.nav>
    </>
  );
}
