import { GraduationCap, Home, Inbox, Target } from "lucide-react";
import { cn } from "@/design-system";

const DOCK = [
  { label: "Today", icon: Home, current: false },
  { label: "Learn", icon: GraduationCap, current: false },
  { label: "Practise", icon: Target, current: true },
  { label: "Recall", icon: Inbox, current: false },
];

// A real phone silhouette next to the browser mockup — the product is the same one on both screens.
export function PhoneWindow() {
  return (
    <figure
      className={cn(
        "w-64 shrink-0 rounded-[46px] bg-[#16161a] p-2.5",
        "shadow-[0_40px_80px_-24px_rgb(10_10_11/0.35)]",
      )}
      aria-hidden
    >
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[36px] bg-[#f7f8fa]">
        <div className="absolute top-2.5 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#16161a]" />

        <div className="flex h-full flex-col px-4 pt-11 pb-4 text-[#16161a]">
          <p className="text-[10.5px] text-[#73737d]">Today · IBPS PO 2026</p>
          <h3 className="mt-1 text-[15px] font-bold tracking-[-0.02em]">
            Every section has its own cutoff
          </h3>

          <div className="mt-4 flex-1 rounded-[20px] bg-[#f2c9ee] p-3.5">
            <p className="text-[9.5px] font-semibold text-black/50">
              Up next · your lowest section
            </p>
            <p className="mt-1.5 text-[15px] leading-tight font-bold">
              Drill General Awareness
            </p>
            <div className="mt-3 flex gap-1.5">
              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold">
                15 min
              </span>
              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-[#a83a2c]">
                50% · 20 under
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {["Quant", "Reasoning", "English", "GA", "Computer"].map((s) => (
              <span
                key={s}
                className="rounded-full bg-[#ececea] px-2 py-1 text-[9px] font-medium text-[#5f5f68]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-3 flex items-center justify-around rounded-full bg-[#16161a] py-2.5 shadow-[0_8px_24px_rgb(19_19_22/0.3)]">
          {DOCK.map(({ label, icon: Icon, current }) => (
            <span
              key={label}
              className={cn(
                "grid size-8 place-items-center rounded-full",
                current ? "bg-white text-[#16161a]" : "text-white/50",
              )}
            >
              <Icon size={15} strokeWidth={2} />
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
