import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { ActiveCard, Brand, StatusPill } from "@/design-system";
import { SECTION_LABEL, SECTIONS } from "@/data/navigation";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode | null;
};

// The five tints a signed-in user lives in, named — the whole palette in one row.
const SECTION_TINT: Record<string, string> = {
  "Quantitative Aptitude": "bg-quant-soft",
  "Reasoning Ability": "bg-reasoning-soft",
  "English Language": "bg-english-soft",
  "General Awareness": "bg-ga-soft",
  "Computer Aptitude": "bg-computer-soft",
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="bg-canvas grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col px-5 pt-7 pb-8 sm:px-10 lg:px-16">
        <Brand href="/" className="self-start" />

        <div className="mx-auto flex w-full max-w-95 flex-1 flex-col justify-center py-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">
            {title}
          </h1>
          <p className="text-ink-2 mt-1.5 text-[14px]">{subtitle}</p>
          {children}
        </div>

        <div className="text-ink-2 text-center text-[14px]">{footer}</div>
      </div>

      {/* One card on an empty stage, not a replica of the app: a sign-in aside is read in two seconds. */}
      <aside
        aria-hidden
        className="bg-frame hidden overflow-hidden pt-6 pl-6 select-none lg:block"
      >
        <div className="bg-stage flex h-full flex-col justify-center gap-12 rounded-tl-[26px] px-14">
          <p className="max-w-[22ch] text-[30px] leading-[1.12] font-bold tracking-[-0.035em]">
            The total is not the exam.
            <span className="text-ink-3 block">
              Every section has its own cutoff.
            </span>
          </p>

          <ActiveCard
            tilt
            kicker="Up next · your lowest section"
            title="Drill General Awareness"
            resumeLabel="Drill General Awareness"
            className="mb-0 max-w-115"
            status={
              <>
                <StatusPill tone="live">
                  <Clock size={14} strokeWidth={2} />
                  15 min
                </StatusPill>
                <StatusPill tone="live" className="text-bad">
                  50% · 20 points under the line
                </StatusPill>
              </>
            }
          >
            So the app opens on the section costing you the paper, not on a
            dashboard.
          </ActiveCard>

          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <span
                key={s}
                className={`rounded-pill px-3.5 py-2 text-[12.5px] font-semibold ${SECTION_TINT[s]}`}
              >
                {SECTION_LABEL[s]}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
