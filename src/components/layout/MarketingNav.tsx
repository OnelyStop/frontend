"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand, ButtonLink } from "@/design-system";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#marking", label: "Marking" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

// A floating pill, not a full-width bar: it has to read on both the dark hero and the plain pages below it.
export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-3 z-50 px-3 sm:top-4 sm:px-5 lg:px-8">
      {/* Liquid glass: a translucent, saturated blur plus an inset rim to catch light, not just a soft solid pill. */}
      <div className="bg-canvas/45 shadow-pop rounded-pill relative mx-auto flex h-14 max-w-300 items-center gap-8 overflow-hidden px-4 ring-1 ring-white/35 backdrop-blur-2xl backdrop-saturate-150 ring-inset sm:px-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
        />
        <Brand href="/" className="text-ink" />

        <nav className="hidden flex-1 items-center gap-7 md:flex">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-ink-2 hover:text-ink text-[14px] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Start free
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-ctl text-ink press ml-auto grid size-10 place-items-center md:hidden"
        >
          {open ? (
            <X size={20} strokeWidth={1.75} />
          ) : (
            <Menu size={20} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* grid-rows-[0fr]→[1fr] rather than height:auto, so the reveal can actually transition. */}
      <div
        className={`mx-auto grid max-w-300 transition-[grid-template-rows] duration-300 ease-[var(--ease-soft)] md:hidden ${open ? "grid-rows-[1fr] pt-2" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-line bg-canvas shadow-pop rounded-[24px] border p-3">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-ink hover:bg-panel block rounded-[14px] px-3 py-2.5 text-[15px] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="border-line mt-2 grid gap-2 border-t p-2 pt-4">
              <ButtonLink href="/login" variant="secondary" block>
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" block>
                Start free
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
