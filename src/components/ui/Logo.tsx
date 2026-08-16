import Link from "next/link";
import "./Logo.css";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-mark ${className}`.trim()} aria-hidden>
      <span />
      <span />
    </span>
  );
}

type BrandProps = { href?: string; className?: string };

export function Brand({ href, className = "" }: BrandProps) {
  const inner = (
    <>
      <LogoMark />
      <span className="brand__name">onelystopp</span>
    </>
  );
  const cls = `brand ${className}`.trim();
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
