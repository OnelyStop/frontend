# Mocks & drills: option-selection and question motion

What the `/mocks` and `/drills` question runners had before this: zero press
feedback anywhere in the app, two different hand-rolled option-row
implementations, and question advance was a bare state swap — no
enter/exit, no transition. The rules and token values are in
[`DESIGN.md`](../DESIGN.md#motion); this is the feature-specific record of
what changed and where it lives.

## What changed

- **Press feedback** — every `Button`/`IconButton`, plus the option rows,
  now scale down on tap and ease back (a tween, not a spring).
- **Option selection** — picking an answer animates the border/fill and
  springs the A/B/C/D badge, instead of a flat colour swap.
- **Question advance** — moving to the next (or previous) question slides
  and fades directionally, instead of cutting instantly.
- **`/mocks` live exam screen was on a hardcoded black theme**
  (`bg-[#0b0b0c]`, raw white-opacity classes) that never touched the design
  system's tokens — a straight break from `DESIGN.md`'s "the page is white"
  rule, and the reason it looked like a different app from `/drills`.
  Rewritten onto the same `canvas`/`ink`/`brand` tokens as everywhere else.

## Where it lives

| File | What's there |
|---|---|
| `src/design-system/styles/theme.css` | Motion tokens (`--ease-swift` etc.), the `.press` utility, reduced-motion overrides |
| `src/design-system/lib/motion.ts` | The framer-motion equivalents — `INDICATOR_SPRING`, `SURFACE`, `questionVariants` |
| `src/design-system/components/option.tsx` | `OptionRow` — the shared MCQ answer control used by both runners |
| `src/design-system/components/button.tsx` | `press` added to `Button`/`IconButton`'s base class |
| `src/context/AppContext.tsx` | Wraps the app in `MotionConfig`, wired to the Settings "Reduce motion" toggle + OS preference |
| `src/app/(app)/mocks/mocks-view.tsx` | Live exam view: light-theme rewrite, `AnimatePresence` question transition, directional `dir` state |
| `src/app/(app)/drills/drills-view.tsx` | Same `AnimatePresence` transition around the running question |

## Dependency

Added `motion` (the current package name for framer-motion, React-19-compatible)
to `package.json`. Imported as `motion/react`.
