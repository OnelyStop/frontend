import type { ReactNode } from "react";

/* Section numbers and the contents rail are CSS counters, so the numbering can
   never drift out of step with the sections themselves. */
const CONTENT = [
  "[counter-reset:sec] max-w-[68ch]",
  "[&_section]:pt-[clamp(36px,4vw,56px)] [&_section:first-child]:pt-0",
  "[&_section+section]:border-line [&_section+section]:mt-[clamp(36px,4vw,56px)] [&_section+section]:border-t",
  "[&_h2]:grid [&_h2]:grid-cols-[44px_minmax(0,1fr)] [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] lg:[&_h2]:text-[28px]",
  "[&_h2]:[counter-increment:sec] [&_h2]:before:[content:counter(sec,decimal-leading-zero)] [&_h2]:before:text-brand [&_h2]:before:text-[14px] [&_h2]:before:leading-[inherit] [&_h2]:before:tabular-nums",
  "[&_h3]:mt-8 [&_h3]:text-[16px] [&_h3]:font-semibold",
  "[&_p]:text-ink-2 [&_p]:mt-3 [&_p]:text-[15px] [&_p]:leading-relaxed",
  "[&_li]:text-ink-2 [&_li]:mt-3 [&_li]:text-[15px] [&_li]:leading-relaxed",
  "[&_h2+p]:mt-4 [&_h3+p]:mt-4 [&_ul]:mt-5",
  "[&_li]:border-line [&_li]:border-b [&_li]:pb-4",
  "[&_li:first-child]:border-line [&_li:first-child]:border-t [&_li:first-child]:pt-4",
  "[&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:text-ink [&_strong]:font-semibold",
].join(" ");

// Marks an unfinished clause; greppable by component name.
export function LegalTodo({ children }: { children: ReactNode }) {
  return (
    <p className="border-brand bg-panel text-ink-2 mt-5 block border-l-2 px-5 py-4 text-[14px]">
      {children}
    </p>
  );
}

export function LegalDoc({
  eyebrow,
  title,
  intro,
  meta,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  meta: string[];
  sections: [string, string][];
  children: ReactNode;
}) {
  return (
    <main className="px-5 pt-[clamp(48px,6vw,96px)] sm:px-8 lg:px-16">
      <header className="border-line mx-auto max-w-300 border-b pb-[clamp(40px,5vw,72px)]">
        <p className="text-ink-3 text-[14px]">{eyebrow}</p>
        <h1 className="mt-4 max-w-[12em] text-[30px] tracking-[-0.02em] text-balance md:text-[36px] lg:text-[40px]">
          {title}
        </h1>
        <p className="text-ink-2 mt-6 max-w-[52ch] text-[18px] leading-relaxed lg:text-[19px]">
          {intro}
        </p>
        <div className="text-ink-3 mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[14px]">
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </header>

      <div className="mx-auto grid max-w-300 gap-8 pt-[clamp(40px,5vw,72px)] pb-[clamp(64px,8vw,120px)] lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-[clamp(32px,6vw,96px)]">
        <nav className="grid content-start gap-1 self-start text-[14px] [counter-reset:toc] lg:sticky lg:top-22">
          <p className="text-ink-3 mb-3 text-[14px]">Contents</p>
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="border-line text-ink-2 hover:text-ink before:text-ink-3 grid grid-cols-[26px_minmax(0,1fr)] border-t py-2 transition-colors [counter-increment:toc] before:tabular-nums before:[content:counter(toc,decimal-leading-zero)]"
            >
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className={CONTENT}>{children}</div>
      </div>
    </main>
  );
}
