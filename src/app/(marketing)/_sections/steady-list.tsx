"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Holds an exclusive <details> list at its tallest open height, so opening one never pushes the page below it.
export function SteadyList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastWidth = -1;

    // Measured on an off-screen clone, one item open at a time, so the real list never flashes.
    const measure = () => {
      const width = el.offsetWidth;
      if (width === lastWidth) return;
      lastWidth = width;

      const clone = el.cloneNode(true) as HTMLDivElement;
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      Object.assign(clone.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: `${width}px`,
        minHeight: "0",
        visibility: "hidden",
        pointerEvents: "none",
      });
      const items = [...clone.querySelectorAll("details")];
      items.forEach((d) => {
        d.removeAttribute("name");
        d.open = false;
      });
      document.body.appendChild(clone);

      let tallest = clone.offsetHeight;
      for (const d of items) {
        d.open = true;
        tallest = Math.max(tallest, clone.offsetHeight);
        d.open = false;
      }
      clone.remove();
      setMinHeight(tallest);
    };

    measure();
    // Webfonts rewrap the answers once they land, which changes the tallest one.
    void document.fonts?.ready.then(() => {
      lastWidth = -1;
      measure();
    });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {children}
    </div>
  );
}
