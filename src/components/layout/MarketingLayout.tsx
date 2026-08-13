import { Link, Outlet } from "react-router-dom";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { Button } from "../ui/Button";
import "./MarketingLayout.css";

export function MarketingLayout() {
  useSmoothScroll();

  return (
    <div className="mk-shell">
      <header className="mk-nav">
        <Link to="/" className="mk-nav__brand">
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
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <Outlet />

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
              <Link to="/signup">Question bank</Link>
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
