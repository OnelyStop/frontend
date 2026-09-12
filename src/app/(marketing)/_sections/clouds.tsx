// A flat-bottomed base plus overlapping circular bumps — the classic puffy-cloud silhouette, not an abstract blur.
function CloudShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" fill="white" className={className} aria-hidden>
      <rect x="18" y="54" width="164" height="38" rx="19" />
      <circle cx="52" cy="54" r="27" />
      <circle cx="94" cy="40" r="34" />
      <circle cx="138" cy="50" r="29" />
      <circle cx="168" cy="60" r="21" />
    </svg>
  );
}

// Corner clusters like craft.do's hero, moonlit on the dark frame instead of daylit on blue — kept small on the drop-shadow blur, since a large one dissolves the scalloped edge into a formless glow.
export function Clouds() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <CloudShape className="absolute top-16 -right-4 w-64 opacity-85 drop-shadow-[0_0_18px_rgba(255,255,255,0.2)] sm:top-20 sm:w-80" />
      <CloudShape className="absolute top-6 left-[6%] hidden w-28 opacity-30 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] md:block" />
      <CloudShape className="absolute top-[26%] -right-8 hidden w-36 opacity-35 drop-shadow-[0_0_12px_rgba(255,255,255,0.12)] lg:block" />
      <CloudShape className="absolute bottom-20 -left-10 w-44 opacity-45 drop-shadow-[0_0_14px_rgba(255,255,255,0.14)] sm:w-56" />
      <CloudShape className="absolute right-[8%] bottom-8 hidden w-32 opacity-30 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] sm:block" />
    </div>
  );
}
