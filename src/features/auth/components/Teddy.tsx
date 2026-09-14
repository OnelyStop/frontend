import { cn } from "@/design-system";

export type TeddyMode = "idle" | "email" | "password";

const FUR = "#c38e62";
const FUR_DARK = "#a9774d";
const PAD = "#ecc59c";
const INK = "#3a2416";

// CSS transforms on SVG groups are in user units; fill-box makes each group rotate about itself, not the viewBox origin.
const MOVE =
  "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-box:fill-box] motion-reduce:transition-none";

function Paw({ x }: { x: number }) {
  return (
    <g>
      <ellipse cx={x} cy={118} rx={18} ry={12.5} fill={FUR_DARK} />
      <ellipse cx={x} cy={121} rx={8} ry={5.5} fill={PAD} />
      {[-9, 0, 9].map((dx) => (
        <circle key={dx} cx={x + dx} cy={111} r={3} fill={PAD} />
      ))}
    </g>
  );
}

export function Teddy({
  mode,
  lookX = 0,
  waving = false,
  className,
}: {
  mode: TeddyMode;
  /** Pupil offset along the email, -1 at its start to 1 at its end. */
  lookX?: number;
  waving?: boolean;
  className?: string;
}) {
  const hiding = mode === "password";
  const reading = mode === "email";
  const px = reading ? Math.max(-1, Math.min(1, lookX)) * 3.5 : 0;
  const py = reading ? 3.5 : 0;

  return (
    <svg
      aria-hidden
      viewBox="0 0 160 132"
      className={cn("block h-auto w-full overflow-visible", className)}
    >
      <g
        className={cn(MOVE, "origin-bottom")}
        style={{
          transform: reading ? "translateY(3px) rotate(-3deg)" : "none",
        }}
      >
        <circle cx={40} cy={38} r={18} fill={FUR_DARK} />
        <circle cx={40} cy={38} r={9} fill={PAD} />
        <circle cx={120} cy={38} r={18} fill={FUR_DARK} />
        <circle cx={120} cy={38} r={9} fill={PAD} />
        <ellipse cx={80} cy={76} rx={49} ry={45} fill={FUR} />

        <g className="origin-center animate-[teddy-blink_4.5s_infinite] [transform-box:fill-box] motion-reduce:animate-none">
          <circle cx={61} cy={68} r={9.5} fill="white" />
          <circle cx={99} cy={68} r={9.5} fill="white" />
          <g
            className={MOVE}
            style={{ transform: `translate(${px}px, ${py}px)` }}
          >
            <circle cx={61} cy={68} r={5.2} fill={INK} />
            <circle cx={99} cy={68} r={5.2} fill={INK} />
            <circle cx={62.8} cy={66.2} r={1.6} fill="white" />
            <circle cx={100.8} cy={66.2} r={1.6} fill="white" />
          </g>
        </g>

        <circle cx={47} cy={90} r={6.5} fill="#ef9f98" fillOpacity={0.55} />
        <circle cx={113} cy={90} r={6.5} fill="#ef9f98" fillOpacity={0.55} />
        <ellipse cx={80} cy={96} rx={22} ry={16} fill={PAD} />
        <ellipse cx={80} cy={88} rx={7.5} ry={5.2} fill={INK} />
        <path
          d={hiding ? "M75 100q5 3 10 0" : "M80 93v4M72 99q8 6 16 0"}
          stroke={INK}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Left paw only ever travels up to the eye; the right one also waves, so it gets a second, animated group. */}
      <g
        className={MOVE}
        style={{
          transform: hiding ? "translate(13px, -50px) rotate(-12deg)" : "none",
        }}
      >
        <Paw x={48} />
      </g>
      <g
        className={MOVE}
        style={{
          transform: hiding
            ? "translate(-13px, -50px) rotate(12deg)"
            : waving
              ? "translate(30px, -58px)"
              : "none",
        }}
      >
        <g
          className={cn(
            "origin-bottom [transform-box:fill-box]",
            waving &&
              !hiding &&
              "animate-[teddy-wave_0.55s_ease-in-out_infinite] motion-reduce:animate-none",
          )}
        >
          <Paw x={112} />
        </g>
      </g>
    </svg>
  );
}
