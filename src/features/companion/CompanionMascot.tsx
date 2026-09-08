"use client";

// Onely's face: idle loops always run; group-hover ones need the parent button.
export function CompanionMascot() {
  return (
    <span className="text-brand relative inline-grid size-8 place-items-center">
      {/* orbiting companion dot — the "infinite" loop */}
      <span
        aria-hidden
        className="absolute inset-0 motion-safe:animate-[mascot-orbit_3.6s_linear_infinite]"
      >
        <span className="bg-brand absolute top-1/2 left-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </span>

      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="size-8 motion-safe:animate-[float-bob_3s_ease-in-out_infinite]"
      >
        <line
          x1="14"
          y1="5"
          x2="14"
          y2="2.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="14" cy="2" r="1.4" fill="currentColor" />

        <rect
          x="4.5"
          y="5"
          width="19"
          height="16"
          rx="7"
          className="fill-ink"
        />

        <g
          className="origin-center motion-safe:animate-[mascot-blink_5.5s_ease-in-out_infinite]"
          fill="#fff"
        >
          <circle cx="10.7" cy="12.6" r="1.7" />
          <circle cx="17.3" cy="12.6" r="1.7" />
        </g>
        <path
          d="M11 16.4c.9.9 5.1.9 6 0"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* arm — waves on hover */}
        <line
          x1="23"
          y1="14"
          x2="26"
          y2="11.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="origin-[23px_14px] motion-safe:group-hover:animate-[mascot-wave_0.6s_ease-in-out_2]"
        />
      </svg>

      {/* hover sparkles */}
      <span aria-hidden className="pointer-events-none absolute inset-0">
        {[
          { key: "a", pos: "top-1 left-0", delay: "0s" },
          { key: "b", pos: "top-2 right-0", delay: "0.12s" },
          { key: "c", pos: "right-1 bottom-0", delay: "0.24s" },
        ].map((s) => (
          <span
            key={s.key}
            className={`bg-brand absolute size-1 rounded-full opacity-0 motion-safe:group-hover:animate-[spark-pop_0.7s_ease-out] ${s.pos}`}
            style={{ animationDelay: s.delay }}
          />
        ))}
      </span>
    </span>
  );
}
