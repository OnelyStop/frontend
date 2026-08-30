import "@/styles/global.css";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/marketing/Logo";
import "./AuthShell.css";

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
    <div className="auth-shell">
      <div className="auth-shell__form-side">
        <Brand href="/" className="auth-shell__brand" />

        <div className="auth-shell__form-wrap">
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>
          {children}
        </div>

        <div className="auth-shell__footer">{footer}</div>
      </div>

      <aside className="auth-shell__brand-side" aria-hidden>
        <blockquote className="auth-shell__quote">
          “I was clearing the total and failing the English cutoff every time.
          The attempt map showed me I was answering the questions I should have
          been skipping.”
          <cite>Priya · IBPS PO 2025</cite>
        </blockquote>
        <ul className="auth-shell__proof">
          {PROOF_POINTS.map((point) => (
            <li key={point}>
              <Check size={15} strokeWidth={2.5} />
              {point}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
