import type { Transition, Variants } from "motion/react";

/* The eases and SURFACE's 150ms mirror the CSS tokens in design-system/styles/theme.css; keep them in sync by hand. */

export const EASE_SWIFT: Transition["ease"] = [0.2, 0, 0, 1];
export const EASE_DECELERATE: Transition["ease"] = [0, 0, 0, 1];
export const EASE_ACCELERATE: Transition["ease"] = [0.3, 0, 1, 1];

export const SURFACE: Transition = { duration: 0.15, ease: EASE_SWIFT };

/* The asymmetry is deliberate: the badge springs in on selection and fades out flat on deselect. */
export const INDICATOR_SPRING: Transition = {
  type: "spring",
  stiffness: 700,
  damping: 30,
  mass: 1,
};
export const INDICATOR_OUT: Transition = { duration: 0.1, ease: "easeOut" };

/* `dir` (1 = forward, -1 = back) arrives as AnimatePresence's `custom`, which is why these variants are functions. */
export const questionVariants: Variants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * 24 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: EASE_DECELERATE },
  },
  exit: (dir: 1 | -1) => ({
    opacity: 0,
    x: dir * -24,
    transition: { duration: 0.1, ease: EASE_ACCELERATE },
  }),
};
