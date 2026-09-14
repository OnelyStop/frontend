import Link from "next/link";
import { cn } from "../lib/cn";
import { MARK_FULL, MARK_VIEW_BOX } from "../lib/mark";

export function Brand({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex shrink-0 items-center whitespace-nowrap text-[18px] font-semibold tracking-[-0.03em]",
    className,
  );
  const lockup = (
    <>
      <span className="sr-only">onelystop</span>
      {/* The mark is the o, so it stands in for the letter rather than sitting beside it and spelling it twice. */}
      <svg
        viewBox={MARK_VIEW_BOX}
        aria-hidden
        shapeRendering="geometricPrecision"
        className="size-[0.8em] shrink-0 translate-y-[0.11em]"
      >
        <path d={MARK_FULL} fillRule="evenodd" fill="currentColor" />
      </svg>
      <span aria-hidden>nelystop</span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {lockup}
    </Link>
  ) : (
    <span className={cls}>{lockup}</span>
  );
}
