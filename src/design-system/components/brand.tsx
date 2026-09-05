import Link from "next/link";
import { cn } from "../lib/cn";

export function Brand({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const cls = cn(
    "shrink-0 whitespace-nowrap text-[18px] font-semibold tracking-[-0.03em]",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>
      onelystop
    </Link>
  ) : (
    <span className={cls}>onelystop</span>
  );
}
