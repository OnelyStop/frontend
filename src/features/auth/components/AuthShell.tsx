import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/design-system";

const PROOF_POINTS = [
  "Sectional mocks with real IBPS and SBI timing",
  "Negative marking priced into every attempt decision",
  "Daily current affairs, filed the way GA asks it",
];

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode | null;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="bg-canvas grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col px-5 pt-7 pb-8 sm:px-10 lg:px-16">
        <Brand href="/" className="self-start" />

        <div className="mx-auto flex w-full max-w-95 flex-1 flex-col justify-center py-8">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em]">
            {title}
          </h1>
          <p className="text-ink-2 mt-1.5 text-[14px]">{subtitle}</p>
          {children}
        </div>

        <div className="text-ink-2 text-center text-[14px]">{footer}</div>
      </div>

      <aside
        className="border-line bg-panel hidden flex-col justify-center gap-7 border-l px-6 py-12 lg:flex lg:px-14"
        aria-hidden
      >
        <blockquote className="max-w-95 text-[18px] leading-snug font-semibold tracking-[-0.02em]">
          “I was clearing the total and failing the English cutoff every time.
          The attempt map showed me I was answering the questions I should have
          been skipping.”
          <cite className="text-ink-2 mt-3 block text-[14px] font-medium not-italic">
            Priya · IBPS PO 2025
          </cite>
        </blockquote>
        <ul className="text-ink-2 grid gap-2.5 text-[14px]">
          {PROOF_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <Check
                size={15}
                strokeWidth={2.5}
                className="text-ok mt-0.5 shrink-0"
              />
              {point}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
