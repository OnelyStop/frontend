"use client";

import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Home, Inbox, Target } from "lucide-react";
import { Dock, DockButton } from "@/design-system";
import { useCompanion } from "@/features/companion/CompanionContext";

// Phones only: from lg the running head and the rail already reach these places.
const PLACES = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/study", label: "Learn", icon: GraduationCap },
  { href: "/mocks", label: "Practise", icon: Target },
  { href: "/current-affairs", label: "Recall", icon: Inbox },
];

export function StageDock() {
  const pathname = usePathname();
  const { openWith } = useCompanion();
  const here = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    // className sets display itself — see Dock's own comment for why a wrapper div can't.
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
  );
}
