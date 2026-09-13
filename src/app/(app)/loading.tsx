// Every route under (app): without it App Router holds the old page until the server answers.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="bg-panel h-8 w-56 rounded" />
        <div className="bg-panel/60 h-3.5 w-36 rounded" />
      </div>

      <div className="grid gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_384px]">
        <div className="min-w-0 space-y-4">
          <div className="bg-panel rounded-card h-52" />
          <div className="bg-panel/60 rounded-card h-36" />
          <div className="bg-panel/60 rounded-card h-36" />
        </div>

        <div className="hidden min-w-0 space-y-4 xl:block">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-panel/60 h-20 rounded-xl" />
            <div className="bg-panel/60 h-20 rounded-xl" />
            <div className="bg-panel/60 h-20 rounded-xl" />
          </div>
          <div className="bg-panel/60 h-4 w-32 rounded" />
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-panel/60 h-16 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="hidden min-w-0 space-y-3.5 xl:block">
          <div className="bg-panel/60 h-4 w-28 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-panel/60 h-44 rounded-4xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
