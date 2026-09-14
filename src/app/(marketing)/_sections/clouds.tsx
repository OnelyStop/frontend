type Cloud = { cx: number; cy: number; w: number; h: number; o: number };

const CLOUDS: Cloud[] = [
  { cx: 130, cy: 560, w: 560, h: 240, o: 1 },
  { cx: 1360, cy: 360, w: 600, h: 260, o: 1 },
  { cx: 190, cy: 150, w: 280, h: 90, o: 0.6 },
  { cx: 1240, cy: 110, w: 320, h: 90, o: 0.5 },
  { cx: 1400, cy: 640, w: 320, h: 150, o: 0.85 },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Puffs({ cx, cy, w, h, seed }: Cloud & { seed: number }) {
  const rand = rng(seed);
  const base = cy + h * 0.28;
  return (
    <>
      <ellipse cx={cx} cy={base} rx={w * 0.5} ry={h * 0.2} />
      {Array.from({ length: 11 }, (_, i) => {
        const x = cx + (rand() - 0.5) * w * 0.78;
        const r =
          h * (0.28 + rand() * 0.3) * (1 - (0.55 * Math.abs(x - cx)) / (w / 2));
        return (
          <ellipse key={i} cx={x} cy={base - r * 0.55} rx={r * 1.25} ry={r} />
        );
      })}
    </>
  );
}

export function Clouds() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        {/* Blur first, then displace: displacing the soft falloff is what turns a clean edge into wisps. */}
        <filter
          id="hero-cloud"
          x="-60%"
          y="-220%"
          width="220%"
          height="540%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="soft" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="4"
            seed="9"
            result="noise"
          />
          <feDisplacementMap
            in="soft"
            in2="noise"
            scale="120"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <pattern
          id="hero-halftone"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="1.25" fill="white" />
        </pattern>
        <mask id="hero-dots">
          <rect
            x="-200"
            y="-200"
            width="1840"
            height="1300"
            fill="url(#hero-halftone)"
          />
        </mask>
      </defs>

      {CLOUDS.map((c, i) => (
        <g key={i} fill="white" opacity={c.o}>
          {/* A larger copy seen only through dots sits under the soft one, so the fringe dithers the way print does. */}
          <g mask="url(#hero-dots)" opacity="0.75">
            <g
              filter="url(#hero-cloud)"
              transform={`translate(${c.cx} ${c.cy}) scale(1.08) translate(${-c.cx} ${-c.cy})`}
            >
              <Puffs {...c} seed={i + 1} />
            </g>
          </g>
          <g filter="url(#hero-cloud)">
            <Puffs {...c} seed={i + 1} />
          </g>
        </g>
      ))}
    </svg>
  );
}
