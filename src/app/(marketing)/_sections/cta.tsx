import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/design-system";

const STROKES = [
  { d: "M-40 250C120 150 260 230 420 170S700 60 880 130", w: 46 },
  { d: "M800 150L890 235L1120 -30", w: 56 },
  { d: "M660 340C800 250 980 300 1260 170", w: 38 },
];

function Brush() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        {/* Displacing a clean round stroke by a little noise is what makes it read as a brush, not a vector line. */}
        <filter id="cta-brush" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="2"
            seed="4"
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g
        filter="url(#cta-brush)"
        fill="none"
        stroke="white"
        strokeOpacity="0.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {STROKES.map(({ d, w }) => (
          <path key={d} d={d} strokeWidth={w} />
        ))}
      </g>
    </svg>
  );
}

export function Cta() {
  return (
    <section className="px-2 py-[clamp(40px,5vw,72px)] sm:px-3">
      <div className="shadow-lift relative mx-auto max-w-300 overflow-hidden rounded-[28px] bg-[#c6c0f3] sm:rounded-[32px]">
        <Brush />
        <div
          aria-hidden
          className="script-grain pointer-events-none absolute inset-0 opacity-[0.25] mix-blend-soft-light"
        />

        <div className="relative flex flex-col gap-8 px-7 py-10 sm:px-12 sm:py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-ink text-[clamp(32px,4vw,48px)] leading-[1.05] font-medium tracking-[-0.03em]">
              Sit your first mock
            </h2>
            <p className="mt-3 text-[17px] text-[#3b3566] sm:text-[19px]">
              Free to start. No card required.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:flex-col md:items-stretch">
            <ButtonLink
              href="#pricing"
              size="lg"
              variant="secondary"
              className="text-ink border-white/70 bg-white/60 shadow-[0_6px_20px_rgb(40_30_90/0.14)] backdrop-blur-md hover:bg-white/80"
            >
              See pricing
            </ButtonLink>
            <ButtonLink href="/signup" size="lg">
              Start free
              <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
