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
    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[18px] font-semibold tracking-[-0.03em]",
    className,
  );
  const lockup = (
    <>
      {/* Sized in em so the mark tracks whatever text size the lockup is set at. */}
      <svg
        viewBox={MARK_VIEW_BOX}
        aria-hidden
        className="size-[1.12em] shrink-0"
      >
        <path d={MARK_FULL} fillRule="evenodd" fill="currentColor" />
      </svg>
      onelystop
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
