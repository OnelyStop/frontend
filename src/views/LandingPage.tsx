import {
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  Flame,
  PenLine,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Star,
} from "lucide-react";
import { GradeRail } from "../components/layout/GradeRail";
import { PlanGrid } from "../components/pricing/PlanGrid";
import { Button } from "../components/ui/Button";
import "./LandingPage.css";
import Link from "next/link";

const FEATURES = [
  {
    icon: PenLine,
    title: "Answer & essay marking",
    desc: "Photo or type your answer — marked against official mark schemes with band-by-band feedback.",
  },
  {
    icon: Shuffle,
    title: "PYQ mixes",
    desc: "Past-year questions blended into fresh, timed sets that target exactly what you haven't mastered.",
  },
  {
    icon: ClipboardList,
    title: "AI-curated exams",
    desc: "Full custom papers assembled from real PYQs and bank items, matched to your board's blueprint.",
  },
  {
    icon: BrainCircuit,
    title: "A* Memory",
    desc: "Spaced repetition tuned to exam season — the high-yield facts resurface right before you'd forget them.",
  },
];

export function LandingPage() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-hero__chip">
            <Sparkles size={13} strokeWidth={2} />
            For OCR · AQA · Edexcel · CIE
          </div>
          <h1>
            Your one stop from first mock to <span>A*</span>.
          </h1>
          <p>
            Question bank, past papers, AI marking, and spaced revision — one
            place that watches your working grade climb, and tells you exactly
            what to do next.
          </p>
          <div className="landing-hero__actions">
            <Link href="/signup">
              <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                Start revising free
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </a>
          </div>
          <div className="landing-hero__proof">
            <span>
              <Star size={14} strokeWidth={2} /> 4.9 from 2,400 reviews
            </span>
            <span>29,865 students</span>
            <span>120k answers marked</span>
          </div>
        </div>

        <div className="landing-hero__art" aria-hidden>
          <div className="landing-hero__rail">
            <GradeRail collapsed={false} />
          </div>
          <div className="landing-hero__card landing-hero__card--marker">
            <div className="landing-hero__card-title">Answer Marker</div>
            <div className="landing-hero__card-band">Band 5 · 14/16</div>
            <p>"Strong AO3 — link the evaluation back to the data in Q4c."</p>
          </div>
          <div className="landing-hero__card landing-hero__card--streak">
            <Flame size={16} strokeWidth={2} />
            12-day streak
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-head">
          <div className="page__eyebrow">Everything in one place</div>
          <h2>Stop juggling six revision tools</h2>
        </div>
        <div className="landing-features__grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="panel landing-feature">
              <feature.icon size={20} strokeWidth={1.75} />
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="landing-section-head">
          <div className="page__eyebrow">Pricing</div>
          <h2>Free to start. One plan when you're serious.</h2>
        </div>
        <PlanGrid variant="public" />
        <div className="pricing-guarantee landing-pricing__guarantee">
          <ShieldCheck size={18} strokeWidth={1.75} />
          <p>
            <strong>Grade-jump promise.</strong> Revise with Pro for 3 months —
            if your working grade doesn't climb, we'll refund you in full.
          </p>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Start climbing to A* today</h2>
        <p>Set your board and subject — your first marked answer is free.</p>
        <Link href="/signup">
          <Button size="lg" rightIcon={<ArrowRight size={16} />}>
            Start revising free
          </Button>
        </Link>
      </section>
    </main>
  );
}
