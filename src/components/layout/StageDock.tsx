"use client";

import { usePathname } from "next/navigation";
import {
  BookOpen,
  GalleryVerticalEnd,
  GraduationCap,
  Home,
  Inbox,
  MessageCircle,
  NotebookPen,
  Search,
  Target,
} from "lucide-react";
import { Dock, DockButton } from "@/design-system";
import { useCompanion } from "@/features/companion/CompanionContext";
import { useRetrieval } from "@/features/retrieval/RetrievalContext";

// On a wide screen the nav is in the running head, so the dock carries the tools; on a phone it is the nav.
const TOOLS = [
  {
    href: "/notes",
    label: "Notes",
    tint: "var(--color-quant-soft)",
    icon: NotebookPen,
  },
  {
    href: "/flashcards",
    label: "Flashcards",
    tint: "var(--color-english-soft)",
    icon: GalleryVerticalEnd,
  },
  {
    href: "/community",
    label: "Community",
    tint: "var(--color-computer-soft)",
    icon: MessageCircle,
  },
];

const PLACES = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/study", label: "Learn", icon: GraduationCap },
  { href: "/mocks", label: "Practise", icon: Target },
  { href: "/current-affairs", label: "Recall", icon: Inbox },
];

export function StageDock() {
  const pathname = usePathname();
  const { openWith } = useCompanion();
  const { setOpen: setSearchOpen } = useRetrieval();
  const here = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const onely = (
    <button
      type="button"
      onClick={() => openWith("")}
      className="press rounded-pill bg-frame-2 flex h-11 items-center gap-2 pr-4 pl-3 text-[13.5px] font-semibold text-white"
    >
      <span className="bg-canvas text-frame grid size-5.5 place-items-center rounded-full">
        <BookOpen size={12} strokeWidth={2.5} />
      </span>
      Ask Onely
    </button>
  );

  return (
    <>
      {/* className sets display itself — see Dock's own comment for why a wrapper div can't. */}
      <Dock className="hidden lg:flex">
        {TOOLS.map(({ href, label, tint, icon: Icon }) => (
          <DockButton
            key={href}
            href={href}
            label={label}
            tint={tint}
            current={here(href)}
          >
            <Icon size={18} strokeWidth={2} />
          </DockButton>
        ))}
        <DockButton
          label="Search"
          tint="var(--color-ga-soft)"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={18} strokeWidth={2} />
        </DockButton>
        {onely}
      </Dock>

      <Dock className="flex lg:hidden">
        {PLACES.map(({ href, label, icon: Icon }) => (
          <DockButton key={href} href={href} label={label} current={here(href)}>
            <Icon size={20} strokeWidth={1.8} />
          </DockButton>
        ))}
        <DockButton
          label="Ask Onely"
          tint="var(--color-brand-soft)"
          onClick={() => openWith("")}
        >
          <BookOpen size={18} strokeWidth={2.25} />
        </DockButton>
      </Dock>
    </>
  );
}
