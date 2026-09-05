import Link from "next/link";
import { Brand, ButtonLink } from "@/design-system";
import { SUPPORT_EMAIL } from "@/config/site";
import { EXAMS } from "@/data/navigation";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

const FOOTER_COLS = [
  {
    title: "Product",
    items: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "/signup", label: "Knowledge base" },
    ],
  },
  {
    title: "Exams",
    items: EXAMS.map((label) => ({ label, href: null })),
  },
  {
    title: "Practise",
    items: ["Mocks", "Drills", "Current affairs", "Descriptive"].map(
      (label) => ({ label, href: null }),
    ),
  },
  {
    title: "Company",
    items: [
      { href: `mailto:${SUPPORT_EMAIL}`, label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-canvas flex min-h-dvh flex-col">
      <Link
        href="/signup"
        className="border-line bg-panel text-ink-2 hover:text-ink flex items-center justify-center gap-1 border-b px-5 py-2.5 text-center text-[14px] transition-colors"
      >
        Two full mocks a month are free, forever
        <span aria-hidden>&nbsp;→</span>
      </Link>

      {/* Opaque, not translucent: the page has dark sections, and any
          transparency turns the bar a muddy grey as they scroll under it. */}
      <header className="border-line bg-canvas sticky top-0 z-50 flex h-14 items-center gap-10 border-b px-5 sm:px-8 lg:px-16">
        <Brand href="/" />
        {/* Dim-the-siblings: hovering the row hushes every link, then restores
            the one under the cursor. */}
        <nav className="group flex flex-1 gap-6">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-ink-2 group-hover:text-ink-3 hover:text-ink! text-[14px] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="secondary" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Start free
          </ButtonLink>
        </div>
      </header>

      {children}

      <footer className="bg-canvas mt-auto px-2 sm:px-3">
        <div className="bg-ink rounded-t-xl px-6 pt-14 pb-8 text-white sm:px-10 lg:px-14">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))] lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
            <div className="max-w-75">
              <div className="text-[20px] font-semibold tracking-[-0.02em]">
                onelystop
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/50">
                Your one stop from first mock to final list.
              </p>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.title} className="grid content-start gap-2">
                <div className="mb-1 text-[14px] font-medium text-white/90">
                  {col.title}
                </div>
                {col.items.map((i) =>
                  i.href ? (
                    <Link
                      key={i.label}
                      href={i.href}
                      className="text-[14px] leading-relaxed text-white/60 transition-colors hover:text-white"
                    >
                      {i.label}
                    </Link>
                  ) : (
                    <span
                      key={i.label}
                      className="text-[14px] leading-relaxed text-white/60"
                    >
                      {i.label}
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>

          {/* 1px, not a hairline: a half-pixel white rule disappears here. */}
          <div className="mt-14 border-t border-white/10 pt-5 text-[12.5px] text-white/50">
            <p>
              © onelystop {new Date().getFullYear()} · Made for people sitting
              these papers.
            </p>
            {/* Not boilerplate: this is what makes naming real exams safe. */}
            <p className="mt-3 max-w-[68ch]">
              onelystop is not affiliated with, endorsed by, or connected to
              IBPS, SBI, RBI or any other recruiting body. Exam names identify
              the paper a mock is modelled on.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
