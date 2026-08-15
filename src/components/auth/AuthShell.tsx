import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { GradeRail } from "../layout/GradeRail";
import "./AuthShell.css";
import Link from "next/link";

const PROOF_POINTS = [
  "Unlimited past papers and PYQ mixes",
  "Answers marked against official mark schemes",
  "Your working grade tracked all the way to A*",
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
        <Link href="/" className="auth-shell__brand">
          <span className="auth-shell__logo" aria-hidden>
            <span />
            <span />
          </span>
          onelystopp
        </Link>

        <div className="auth-shell__form-wrap">
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>
          {children}
        </div>

        <div className="auth-shell__footer">{footer}</div>
      </div>

      <aside className="auth-shell__brand-side" aria-hidden>
        <div className="auth-shell__rail">
          <GradeRail collapsed={false} />
        </div>
        <blockquote className="auth-shell__quote">
          “I went from a low B to an A* in Biology. The marker told me exactly
          which AO I kept dropping marks on.”
          <cite>Priya · OCR Biology, 2026</cite>
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
