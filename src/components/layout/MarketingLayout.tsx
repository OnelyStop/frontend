import { Button } from "../ui/Button";
import "./MarketingLayout.css";
import Link from "next/link";

export function MarketingLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="mk-shell">
      <header className="mk-nav">
        <Link href="/" className="mk-nav__brand">
          <span className="mk-nav__logo" aria-hidden>
            <span />
            <span />
          </span>
          onelystopp
        </Link>
        <nav className="mk-nav__links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="mk-nav__actions">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      {children}

      <footer className="mk-footer">
        <div className="mk-footer__inner">
          <div className="mk-footer__brand">
            <span className="mk-nav__logo" aria-hidden>
              <span />
              <span />
            </span>
            <div>
              <div className="mk-footer__name">onelystopp</div>
              <p>Your one stop from first mock to A*.</p>
            </div>
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
            </div>
            <div>
              <div className="mk-footer__col-title">Company</div>
              <span>About</span>
              <span>Contact</span>
              <span>Privacy</span>
            </div>
          </div>
        </div>
        <div className="mk-footer__legal">
          © {new Date().getFullYear()} onelystopp. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
