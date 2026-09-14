import { cn } from "@/design-system";
import type { TeddyMode } from "./Teddy";

const FUR = "#8f969e";
const FUR_LIGHT = "#b9bec4";
const FUR_DARK = "#6f767e";
const PINK = "#f3b8c4";
const BELLY = "#f5dde1";
const INK = "#2a2a2e";

// Hands grip the rail at this y of a 140-wide viewBox; the parent lines that up with the bar.
const GRIP_Y = 8;

const EASE =
  "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none";

function Claws({
  x,
  y,
  flip = false,
}: {
  x: number;
  y: number;
  flip?: boolean;
}) {
  const d = flip ? -1 : 1;
  return (
    <g stroke={INK} strokeWidth={1.4} strokeLinecap="round">
      {[-4, 0, 4].map((dx) => (
        <line key={dx} x1={x + dx} y1={y} x2={x + dx + d} y2={y + 4} />
      ))}
    </g>
  );
}

// A filled, tapering limb that starts inside the body and passes outside the ear, so body and fur hide every join.
function Arm({ flip = false }: { flip?: boolean }) {
  const x = (v: number) => (flip ? 140 - v : v);
  const hand = x(40);
  return (
    <g>
      <path
        d={`M${x(58)} 134C${x(26)} 122 ${x(8)} 82 ${x(30)} ${GRIP_Y + 2}L${x(50)} ${GRIP_Y + 2}C${x(34)} 70 ${x(46)} 104 ${x(70)} 122Z`}
        fill={FUR}
      />
      <ellipse cx={hand} cy={GRIP_Y} rx={11} ry={9.5} fill={FUR_DARK} />
      <Claws x={hand} y={GRIP_Y - 9} flip={flip} />
    </g>
  );
}

function Ear({ cx, flip = false }: { cx: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g>
      {/* Soft scallops round the rim are what make the ear read as fluffy rather than a disc. */}
      {[
        [-19, 36],
        [-8, 26],
        [6, 26],
        [-22, 52],
      ].map(([dx, cy]) => (
        <circle
          key={`${dx}-${cy}`}
          cx={cx + dx! * s}
          cy={cy}
          r={8}
          fill={FUR}
        />
      ))}
      <circle cx={cx} cy={48} r={23} fill={FUR} />
      <circle cx={cx + 3 * s} cy={50} r={13.5} fill={PINK} />
      <circle cx={cx + 5 * s} cy={50} r={7} fill="#f7cfd7" />
    </g>
  );
}

export function Koala({
  mode,
  lookX = 0,
  waving = false,
  climbing = false,
  className,
}: {
  mode: TeddyMode;
  /** Where the input is, sideways from the koala: -1 far left, 1 far right. */
  lookX?: number;
  waving?: boolean;
  /** Hand over hand, while the parent slides it along the rail. */
  climbing?: boolean;
  className?: string;
}) {
  const shut = mode === "password";
  const reading = mode === "email";
  const px = reading ? Math.max(-1, Math.min(1, lookX)) * 2.5 : 0;
  const py = reading ? 3.2 : 0;
  const climb = climbing && !waving;

  return (
    <svg
      aria-hidden
      viewBox="0 0 140 196"
      className={cn("block h-auto w-full overflow-visible", className)}
    >
      <g
        style={{ transformOrigin: "46px 128px" }}
        className={cn(
          climb &&
            "animate-[koala-climb_0.7s_ease-in-out_infinite] motion-reduce:animate-none",
        )}
      >
        <Arm />
      </g>
      {/* The waving arm lets go of the rail and swings out from its own shoulder. */}
      <g
        className={EASE}
        style={{
          transformOrigin: "94px 128px",
          transform: waving ? "rotate(70deg)" : "none",
        }}
      >
        <g
          style={{ transformOrigin: "94px 128px" }}
          className={cn(
            waving &&
              "animate-[teddy-wave_0.55s_ease-in-out_infinite] motion-reduce:animate-none",
            climb &&
              "animate-[koala-climb_0.7s_ease-in-out_infinite] [animation-delay:-0.35s] motion-reduce:animate-none",
          )}
        >
          <Arm flip />
        </g>
      </g>

      <g
        className={cn(
          climb &&
            "animate-[koala-bob_0.35s_ease-in-out_infinite] motion-reduce:animate-none",
        )}
      >
        <ellipse cx={70} cy={146} rx={31} ry={38} fill={FUR} />
        <ellipse cx={72} cy={152} rx={17} ry={25} fill={BELLY} />
        <ellipse cx={50} cy={180} rx={14} ry={10} fill={FUR_DARK} />
        <ellipse cx={92} cy={180} rx={14} ry={10} fill={FUR_DARK} />
        <Claws x={50} y={184} />
        <Claws x={92} y={184} flip />

        <g
          className={EASE}
          style={{
            transformOrigin: "70px 112px",
            transform: reading ? "rotate(-4deg) translateY(2px)" : "none",
          }}
        >
          <Ear cx={30} />
          <Ear cx={110} flip />
          <ellipse cx={70} cy={80} rx={42} ry={36} fill={FUR} />
          <ellipse cx={70} cy={96} rx={26} ry={18} fill={FUR_LIGHT} />

          {shut ? (
            <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none">
              <path d="M47 77q6 5 12 0" />
              <path d="M81 77q6 5 12 0" />
            </g>
          ) : (
            <g
              style={{ transformOrigin: "70px 76px" }}
              className="animate-[teddy-blink_5s_infinite] motion-reduce:animate-none"
            >
              <circle cx={53} cy={76} r={7} fill="white" />
              <circle cx={87} cy={76} r={7} fill="white" />
              <g
                className={EASE}
                style={{ transform: `translate(${px}px, ${py}px)` }}
              >
                <circle cx={53} cy={76} r={5.2} fill="#6b4226" />
                <circle cx={87} cy={76} r={5.2} fill="#6b4226" />
                <circle cx={53} cy={76} r={2.8} fill={INK} />
                <circle cx={87} cy={76} r={2.8} fill={INK} />
                <circle cx={54.8} cy={74} r={1.5} fill="white" />
                <circle cx={88.8} cy={74} r={1.5} fill="white" />
              </g>
            </g>
          )}

          <circle cx={42} cy={92} r={6} fill={PINK} fillOpacity={0.55} />
          <circle cx={98} cy={92} r={6} fill={PINK} fillOpacity={0.55} />
          <path
            d="M70 78c9 0 13 6 13 13s-6 12-13 12-13-5-13-12 4-13 13-13z"
            fill={INK}
          />
          <ellipse
            cx={65}
            cy={85}
            rx={3}
            ry={4.5}
            fill="white"
            fillOpacity={0.3}
          />
          <path
            d="M61 107q9 8 18 0"
            stroke={INK}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
          <path d="M66 109q4 4 8 0z" fill="#e98a9c" />
        </g>
      </g>
    </svg>
  );
}
