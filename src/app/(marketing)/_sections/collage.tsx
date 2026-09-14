type Pt = [number, number];

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

// Seeded, so server and every visitor draw the same tear; whole units at an 8-unit step keep it ragged at half the markup.
function torn(points: Pt[], seed: number, amp = 6, step = 8): string {
  const rand = rng(seed);
  const out: string[] = [];
  let drift = 0;
  points.forEach(([x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(len / step));
    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      drift = drift * 0.8 + (rand() - 0.5) * amp;
      const off = drift + (rand() - 0.5) * amp * 0.5;
      out.push(
        `${Math.round(x1 + (x2 - x1) * t + nx * off)},${Math.round(y1 + (y2 - y1) * t + ny * off)}`,
      );
    }
  });
  return `M${out.join("L")}Z`;
}

function grow(points: Pt[], [cx, cy]: Pt, s: number): Pt[] {
  return points.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);
}

const MARKED = [2, 0, 3, 1, 1, 3, 0, 2, 3, 1, 2, 0];
const PAPER = "#fbfbfd";
const MINT = "#8ccfbf";
const GREY = "#cdd0d8";
const INK = "#1f1d24";
const PINK = "#e3a3c2";

function OmrSheet({
  transform,
  w,
  h,
  blocks,
  rows,
}: {
  transform: string;
  w: number;
  h: number;
  blocks: number;
  rows: number;
}) {
  const sheet: Pt[] = [
    [0, 8],
    [w, 0],
    [w, h],
    [0, h],
  ];
  return (
    <g transform={transform}>
      <path d={torn(sheet, 41, 4, 7)} fill={PAPER} />
      <line
        x1="28"
        y1="30"
        x2={w - 30}
        y2="30"
        stroke={PINK}
        strokeWidth="1.5"
      />
      {Array.from({ length: blocks }, (_, block) =>
        Array.from({ length: rows }, (_, row) => {
          const x = 44 + block * 205;
          const y = 62 + row * 36;
          const q = block * rows + row;
          return (
            <g key={q}>
              <text
                x={x}
                y={y + 4}
                fontSize="11"
                fill="#c98aa9"
                className="font-sans tabular-nums"
              >
                {q + 1}
              </text>
              {[0, 1, 2, 3].map((opt) => {
                const marked = opt === MARKED[q % MARKED.length];
                return (
                  <circle
                    key={opt}
                    cx={x + 34 + opt * 30}
                    cy={y}
                    r="9.5"
                    fill={marked ? "#2a2733" : "none"}
                    stroke={marked ? "none" : PINK}
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        }),
      )}
    </g>
  );
}

function Notebook({ points, uid }: { points: Pt[]; uid: string }) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs) - 40;
  const x1 = Math.max(...xs) + 40;
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const tilt = (x1 - x0) * 0.13;
  const margin = x0 + (x1 - x0) * 0.28;
  const path = torn(points, 7, 5);
  const rules = Array.from(
    { length: Math.ceil((y1 - y0 + tilt) / 32) },
    (_, i) => y0 + i * 32,
  );
  return (
    <g>
      <clipPath id={`hero-notebook-${uid}`}>
        <path d={path} />
      </clipPath>
      <path d={path} fill="#f3d97c" />
      <g clipPath={`url(#hero-notebook-${uid})`}>
        {rules.map((y) => (
          <line
            key={y}
            x1={x0}
            y1={y + tilt}
            x2={x1}
            y2={y}
            stroke="#86a97c"
            strokeWidth="1.3"
            strokeOpacity="0.75"
          />
        ))}
        {[0, 8].map((dx) => (
          <line
            key={dx}
            x1={margin + dx}
            y1={y0}
            x2={margin + dx + (y1 - y0) * 0.13}
            y2={y1}
            stroke="#e48a84"
            strokeWidth="1.3"
          />
        ))}
      </g>
    </g>
  );
}

function Stamp({ x, y }: { x: number; y: number }) {
  const RED = "#c9463d";
  return (
    <g
      transform={`translate(${x} ${y}) rotate(-14)`}
      opacity="0.8"
      className="font-sans"
    >
      <circle r="54" fill="none" stroke={RED} strokeWidth="3" />
      <circle r="45" fill="none" stroke={RED} strokeWidth="1.2" />
      <text
        y="-2"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        letterSpacing="1.5"
        fill={RED}
      >
        CLEARED
      </text>
      <text
        y="18"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill={RED}
        className="tabular-nums"
      >
        60.25 / 55
      </text>
    </g>
  );
}

function Rimmed({
  points,
  fill,
  seed,
  centre,
  s,
}: {
  points: Pt[];
  fill: string;
  seed: number;
  centre: Pt;
  s: number;
}) {
  return (
    <>
      <path d={torn(grow(points, centre, s), seed + 1, 10)} fill="#ffffff" />
      <path d={torn(points, seed, 6)} fill={fill} />
    </>
  );
}

function Wide() {
  return (
    <>
      <g filter="url(#hero-lift-wide)">
        <OmrSheet
          transform="translate(0 276) rotate(-18)"
          w={860}
          h={520}
          blocks={4}
          rows={3}
        />
      </g>
      <g filter="url(#hero-lift-wide)">
        <Rimmed
          points={[
            [800, 720],
            [852, 214],
            [896, 124],
            [948, 64],
            [1000, 30],
            [1052, 52],
            [1112, 112],
            [1182, 170],
            [1262, 192],
            [1332, 244],
            [1384, 334],
            [1404, 720],
          ]}
          fill={GREY}
          seed={11}
          centre={[1100, 720]}
          s={1.05}
        />
      </g>
      <g filter="url(#hero-lift-wide)">
        <Rimmed
          points={[
            [1168, 156],
            [1214, 126],
            [1270, 136],
            [1330, 114],
            [1392, 130],
            [1470, 120],
            [1470, 218],
            [1392, 232],
            [1322, 214],
            [1252, 234],
            [1196, 214],
          ]}
          fill={INK}
          seed={21}
          centre={[1320, 175]}
          s={1.12}
        />
      </g>
      <g filter="url(#hero-lift-wide)">
        <path
          d={torn(
            [
              [-20, 720],
              [-20, 270],
              [60, 222],
              [150, 168],
              [215, 146],
              [292, 178],
              [362, 252],
              [424, 334],
              [476, 430],
              [530, 720],
            ],
            31,
            7,
          )}
          fill={MINT}
        />
      </g>
      <g filter="url(#hero-lift-wide)">
        <Notebook
          uid="wide"
          points={[
            [1112, 352],
            [1250, 306],
            [1362, 268],
            [1480, 238],
            [1480, 720],
            [1092, 720],
          ]}
        />
        <Stamp x={1330} y={480} />
      </g>
    </>
  );
}

// Portrait arrangement: the phone covers the middle, so every piece has to show above it or at its edges.
function Narrow() {
  return (
    <>
      <g filter="url(#hero-lift-narrow)">
        <Rimmed
          points={[
            [180, 640],
            [222, 72],
            [262, 32],
            [302, 14],
            [346, 42],
            [382, 122],
            [400, 640],
          ]}
          fill={GREY}
          seed={51}
          centre={[290, 640]}
          s={1.06}
        />
      </g>
      <g filter="url(#hero-lift-narrow)">
        <OmrSheet
          transform="translate(100 44) rotate(-8)"
          w={330}
          h={420}
          blocks={2}
          rows={2}
        />
      </g>
      <g filter="url(#hero-lift-narrow)">
        <path
          d={torn(
            [
              [-20, 640],
              [-20, 150],
              [30, 95],
              [95, 62],
              [160, 80],
              [205, 132],
              [190, 232],
              [150, 640],
            ],
            61,
            7,
          )}
          fill={MINT}
        />
      </g>
      <g filter="url(#hero-lift-narrow)">
        <Rimmed
          points={[
            [380, 42],
            [420, 24],
            [470, 32],
            [520, 20],
            [560, 28],
            [560, 72],
            [505, 82],
            [450, 74],
            [405, 80],
          ]}
          fill={INK}
          seed={71}
          centre={[470, 52]}
          s={1.15}
        />
      </g>
      <g filter="url(#hero-lift-narrow)">
        <Notebook
          uid="narrow"
          points={[
            [300, 124],
            [410, 84],
            [560, 46],
            [560, 640],
            [420, 640],
          ]}
        />
      </g>
    </>
  );
}

export function Collage({
  variant,
  className,
}: {
  variant: "wide" | "narrow";
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox={variant === "wide" ? "0 0 1440 600" : "0 0 520 600"}
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <defs>
        {/* Ids carry the variant: both SVGs are in the DOM, and a reference into the one hidden by display:none renders nothing. */}
        <filter
          id={`hero-lift-${variant}`}
          x="-10%"
          y="-10%"
          width="120%"
          height="130%"
        >
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="10"
            floodColor="#3b2f5e"
            floodOpacity="0.14"
          />
        </filter>
      </defs>
      {/* Slice scales to width on wide screens, cropping the top of the viewBox; the shift keeps every torn top inside it instead of cut flat. */}
      {variant === "wide" ? (
        <g transform="translate(0 70)">
          <Wide />
        </g>
      ) : (
        <Narrow />
      )}
    </svg>
  );
}
