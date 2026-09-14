import Link from "next/link";
import { SUPPORT_EMAIL } from "@/config/site";
import { EXAMS } from "@/data/navigation";
import { MarketingNav } from "./MarketingNav";

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
    <div className="flex min-h-dvh flex-col bg-[#f7f4ee]">
      <MarketingNav />

      {children}

      <footer className="mt-auto bg-[#f7f4ee] px-2 sm:px-3">
        <div className="bg-frame rounded-t-[28px] px-6 pt-14 pb-8 text-white sm:px-10 lg:px-14">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))] lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
            <div className="max-w-75">
              <div className="text-[20px] font-semibold tracking-[-0.02em]">
                onelystop
              </div>
              <p className="text-on-frame-2 mt-2 text-[14px] leading-relaxed">
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
                      className="text-on-frame-2 text-[14px] leading-relaxed transition-colors hover:text-white"
                    >
                      {i.label}
                    </Link>
                  ) : (
                    <span
                      key={i.label}
                      className="text-on-frame-2 text-[14px] leading-relaxed"
                    >
                      {i.label}
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>

          {/* on-frame-line, not white/10: the frame chrome elsewhere in the app draws its rules that way. */}
          <div className="border-on-frame-line text-on-frame-2 mt-14 border-t pt-5 text-[12.5px]">
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
