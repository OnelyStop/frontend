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

// Fixed, not sticky: sticky still claims a row in flow, which shows as a strip of page above the hero card.
export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-5 z-50">
      <div className="px-4 sm:px-7 lg:px-10">
        {/* Dock glass: nearly clear fill with the saturation pushed, so what's behind shows through as colour; the rim and inner highlight give it an edge. */}
        <div className="relative mx-auto flex h-14 max-w-300 items-center gap-8 overflow-hidden rounded-[22px] border border-white/45 bg-white/25 px-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),inset_0_-1px_0_rgb(255_255_255/0.15),0_8px_32px_rgb(30_20_60/0.14)] backdrop-blur-xl backdrop-saturate-[1.8] sm:px-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"
          />
          <Brand href="/" className="text-ink relative" />

          <nav className="hidden flex-1 items-center gap-7 md:flex">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-ink/80 hover:text-ink relative text-[14px] font-medium transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <span aria-hidden className="mr-2 h-7 w-px bg-black/15" />
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
            className="rounded-ctl text-ink press relative ml-auto grid size-10 place-items-center md:hidden"
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
    </div>
  );
}
