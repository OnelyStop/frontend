import type { Transition, Variants } from "motion/react";

/* Motion constants shared by the mock and drill runners. One spring, one
   surface transition, one pair of directional variants — so the two screens
   can't quietly drift onto different numbers. EASE_SWIFT/EASE_DECELERATE/
   EASE_ACCELERATE and SURFACE's 150ms mirror the CSS tokens in
   design-system/styles/theme.css; keep those in sync by hand. INDICATOR_OUT
   and questionVariants.exit's 100ms are JS-only — nothing in CSS transitions
   at that speed, so there's no token to mirror. */

export const EASE_SWIFT: Transition["ease"] = [0.2, 0, 0, 1];
export const EASE_DECELERATE: Transition["ease"] = [0, 0, 0, 1];
export const EASE_ACCELERATE: Transition["ease"] = [0.3, 0, 1, 1];

/* Colour/opacity — "effects" in M3 terms. These never overshoot, so it's a
   plain eased tween, not a spring. */
export const SURFACE: Transition = { duration: 0.15, ease: EASE_SWIFT };

/* The selected-option badge is the one thing allowed to spring — a "spatial"
   property (scale), not a colour. Deselect falls back to a plain 100ms
   ease-out below; the asymmetry (spring in, quick fade out) is deliberate. */
export const INDICATOR_SPRING: Transition = {
  type: "spring",
  stiffness: 700,
  damping: 30,
  mass: 1,
};
export const INDICATOR_OUT: Transition = { duration: 0.1, ease: "easeOut" };

/* Shared-axis question transition. `dir` (1 = forward, -1 = back) is passed
   as AnimatePresence's `custom`, so enter/exit read it via the variant
   function and slide the correct way. Out is quick + accelerating (getting
   out of the way); in is a touch slower + decelerating (arriving). */
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
