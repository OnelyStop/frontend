import { ButtonLink } from "@/design-system";
import { AppWindow } from "./app-window";
import { Clouds } from "./clouds";
import { Collage } from "./collage";
import { PhoneWindow } from "./phone-window";

const GRAIN =
  "script-grain pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light";

function Wordmark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMin meet"
      className="pointer-events-none absolute inset-x-[4%] -top-[clamp(70px,7vw,104px)] hidden h-[clamp(150px,17vw,240px)] w-[92%] md:block"
    >
      <text
        x="600"
        y="222"
        textAnchor="middle"
        fontSize="258"
        fontWeight="600"
        letterSpacing="-6"
        fill="none"
        stroke="#3a3470"
        strokeOpacity="0.5"
        strokeWidth="1.3"
        strokeDasharray="7 6"
        vectorEffect="non-scaling-stroke"
        className="font-sans"
      >
        onelystop
      </text>
    </svg>
  );
}

export function Hero() {
  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="shadow-card relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#a5b1f2_0%,#c4bff3_40%,#e7d3f1_74%,#f8dccd_100%)] sm:rounded-[36px]">
        <Clouds />
        <div aria-hidden className={GRAIN} />

        {/* z-10: the wordmark reaches up behind the buttons, and a later sibling would otherwise paint over them. */}
        <div className="relative z-10 px-5 pt-[clamp(92px,7vw,104px)] text-center sm:px-8">
          <h1 className="text-ink mx-auto max-w-[14ch] text-[clamp(38px,4.4vw,60px)] leading-[1.03] font-medium tracking-[-0.035em] text-balance">
            Clear every sectional cutoff
          </h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-[16px] leading-relaxed text-[#393450] sm:text-[17px]">
            Full IBPS, SBI and RBI mocks under real sectional timing, drills
            aimed at what costs you marks, and scoring that counts negative
            marking the way the paper does.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Sit a free mock
            </ButtonLink>
            <ButtonLink
              href="#marking"
              size="lg"
              variant="secondary"
              className="text-ink border-white/70 bg-white/50 shadow-xs backdrop-blur-md hover:bg-white/70"
            >
              See a marked answer
            </ButtonLink>
          </div>
        </div>

        {/* The collage gets its own band under the copy, so no torn paper runs behind the paragraph. */}
        <div className="relative mt-[clamp(24px,2.5vw,32px)] h-[440px] md:h-[max(400px,37vw)]">
          <Wordmark />
          <Collage
            variant="wide"
            className="absolute inset-0 hidden size-full sm:block"
          />
          <Collage
            variant="narrow"
            className="absolute inset-0 size-full sm:hidden"
          />
          <div aria-hidden className={GRAIN} />

          <div className="absolute inset-x-0 bottom-0 mx-auto hidden h-[clamp(280px,25vw,440px)] max-w-230 px-8 md:block xl:max-w-210 xl:px-0">
            <AppWindow />
          </div>

          {/* A phone is what this page is read on below md, so that is the device it shows there. */}
          <PhoneWindow className="absolute top-[104px] left-1/2 w-[min(318px,80vw)] -translate-x-1/2 md:hidden" />
        </div>
      </div>
    </section>
  );
}
