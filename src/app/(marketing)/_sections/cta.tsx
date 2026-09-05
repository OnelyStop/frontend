import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/design-system";

const DOT_FIELD: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at center, rgb(10 10 10 / 0.16) 1px, transparent 1.6px)",
  backgroundSize: "10px 10px",
  maskImage:
    "linear-gradient(to right, #000 0%, transparent 36%, transparent 64%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

export function Cta() {
  return (
    <section className="bg-canvas pt-0! pb-[clamp(56px,7vw,104px)]">
      <div className="relative mx-auto max-w-300 overflow-hidden px-5 py-[clamp(36px,4vw,56px)] sm:px-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={DOT_FIELD}
          aria-hidden
        />
        <div className="relative z-1 text-center">
          <h2 className="mx-auto max-w-[16em] text-[30px] leading-tight tracking-[-0.02em] text-balance md:text-[36px] lg:text-[40px]">
            Mark your first answer.
          </h2>
          <p className="text-ink-2 mx-auto mt-5 max-w-[46ch] text-[18px] leading-relaxed">
            Free to start, no card. Every past paper we can legally host is
            included.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Start free
              <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="#pricing" size="lg" variant="secondary">
              See pricing
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
