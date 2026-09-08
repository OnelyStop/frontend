// Painted the instant a topic link is clicked; mirrors Reader's two columns.
export default function Loading() {
  return (
    <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
      <aside className="mb-8 hidden lg:block" aria-hidden>
        <div className="sticky top-20 space-y-2">
          <div className="bg-panel h-3 w-24 rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-panel/60 rounded-ctl h-7" />
          ))}
        </div>
      </aside>

      <div className="min-w-0 animate-pulse" aria-hidden>
        <div className="bg-panel mb-6 h-3 w-64 rounded" />
        <div className="bg-panel h-9 w-3/4 rounded" />
        <div className="mt-4 flex gap-2">
          <div className="bg-panel rounded-pill h-5 w-20" />
          <div className="bg-panel rounded-pill h-5 w-24" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="bg-panel/60 h-3 w-full rounded" />
          <div className="bg-panel/60 h-3 w-11/12 rounded" />
          <div className="bg-panel/60 h-3 w-4/5 rounded" />
        </div>

        <div className="border-line rounded-ctl mt-8 h-28 border" />

        <div className="mt-10 space-y-9">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <div className="bg-panel h-5 w-1/3 rounded" />
              <div className="bg-panel/60 h-3 w-full rounded" />
              <div className="bg-panel/60 h-3 w-full rounded" />
              <div className="bg-panel/60 h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
