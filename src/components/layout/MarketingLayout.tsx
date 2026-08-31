import "@/styles/global.css";
import { ButtonLink } from "@/components/marketing/Button";
import { Brand } from "@/components/marketing/Logo";
import "./MarketingLayout.css";
import Link from "next/link";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk-shell">
      <Link href="/signup" className="mk-banner t-label">
        Every past paper we can legally host is free, forever
        <span aria-hidden>&nbsp;→</span>
      </Link>
      <header className="mk-nav">
        <Brand href="/" />
        <nav className="mk-nav__links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="mk-nav__actions">
          <ButtonLink href="/login" variant="outline" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Start free
          </ButtonLink>
        </div>
      </header>

      {children}

      <footer className="mk-footer">
        <div className="mk-footer__panel t-slab">
          <div className="mk-footer__inner">
            <div className="mk-footer__brand">
              <div className="mk-footer__name">onelystop</div>
              <p>Your one stop from first mock to A*.</p>
            </div>
            <div className="mk-footer__cols">
              <div>
                <div className="mk-footer__col-title">Product</div>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <Link href="/signup">Question bank</Link>
              </div>
              <div>
                <div className="mk-footer__col-title">Boards</div>
                <span>OCR</span>
                <span>AQA</span>
                <span>Edexcel</span>
                <span>CIE</span>
                <span>WJEC</span>
              </div>
              <div>
                <div className="mk-footer__col-title">Revise</div>
                <span>Past papers</span>
                <span>PYQ mixes</span>
                <span>AI exams</span>
                <span>Memory</span>
              </div>
              <div>
                <div className="mk-footer__col-title">Company</div>
                <span>About</span>
                <span>Contact</span>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className="mk-footer__legal">
            <p>
              © onelystop {new Date().getFullYear()} · Made for people sitting
              these papers.
            </p>
            <p className="mk-footer__disclaimer">
              onelystop is not affiliated with, endorsed by, or connected to
              OCR, AQA, Pearson Edexcel or Cambridge International.
              Specification codes are used to identify the syllabus a question
              belongs to.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
