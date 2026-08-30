import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/marketing/Button";
import "./cta.css";

export function Cta() {
  return (
    <section className="cta">
      <div className="cta__band">
        <div className="cta__dots" aria-hidden />
        <div className="cta__inner">
          <h2 className="display d2 trim">Mark your first answer.</h2>
          <p className="t-lede trim cta__sub">
            Free to start, no card. Every past paper we can legally host is
            included.
          </p>
          <div className="cta__actions">
            <ButtonLink
              href="/signup"
              size="lg"
              rightIcon={<ArrowRight size={16} />}
            >
              Start free
            </ButtonLink>
            <ButtonLink href="#pricing" size="lg" variant="outline">
              See pricing
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
