import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/* Every action is a pill. Primary is black, secondary is a hairline on white,
   ghost is text alone. Nothing fills grey on hover — a bordered control
   darkens its border, a text control darkens its ink. */
const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85",
  secondary: "border border-line-2 bg-canvas text-ink hover:border-ink/25",
  ghost: "text-ink-2 hover:text-ink",
  danger: "bg-bad text-white hover:bg-bad/85",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3.5 text-[13px]",
  md: "h-10 gap-2 px-5 text-[14px]",
  lg: "h-12 gap-2 px-7 text-[15px]",
};

const BASE =
  "press inline-flex shrink-0 items-center justify-center rounded-pill disabled:cursor-not-allowed disabled:opacity-40";

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, cn(block && "w-full", className))}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={buttonClass(variant, size, cn(block && "w-full", className))}
    >
      {children}
    </Link>
  );
}

/** Bare icon, no label: close, dismiss, step. */
export function IconButton({
  label,
  children,
  className,
  ...rest
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "press grid size-9 shrink-0 place-items-center rounded-pill text-ink-3 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
