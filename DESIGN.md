# Design system

Everything the signed-in app is built from lives in `src/design-system/`. A new
page should be a `PageHeader` plus a few `Card`s or a `Lattice` — if you find
yourself writing a bordered box, a pill, or a bar from raw Tailwind, the
primitive already exists.

**See it running at `/design`.** That route renders every component in the
system, so a change to a primitive is visible in one place before it reaches a
page.

## Layout

```
src/design-system/
  index.ts                 single entry — import everything from "@/design-system"
  styles/theme.css         tokens (@theme) + base layer + custom utilities
  lib/cn.ts                clsx + tailwind-merge, so a caller's class always wins
  lib/motion.ts            shared framer-motion constants — springs, easings, variants
  components/
    button.tsx             Button, ButtonLink, IconButton
    surface.tsx            Card, DarkPanel, Lattice, LatticeCell, Popover, MenuRow
    form.tsx               Field, Input, Textarea, Select, Checkbox, Segmented
    data.tsx               Badge, Stat, Meter, CutoffBar, Avatar, Kbd, Table
    page.tsx               PageHeader, SectionTitle, Empty, Divider
    option.tsx             OptionRow — the MCQ answer control
```

This mirrors what production systems do — `components/` + `styles/` + `lib/`
behind one barrel — as in [Vercel's next-forge](https://github.com/vercel/next-forge/tree/main/packages/design-system),
[Cal.com's packages/ui](https://github.com/calcom/cal.com/tree/main/packages/ui)
and [Dub's packages/ui](https://github.com/dubinc/dub/tree/main/packages/ui/src).
It sits in `src/` rather than a `packages/` workspace because this is a single
app; if a second app ever appears, the folder lifts out unchanged.

Legacy marketing components (`Button`, `Logo` with their `.css`) live in
`src/components/marketing/`. They are **not** part of the system and should not
be imported by app pages — the landing page still runs on the old stylesheet.

## The rules

These are the decisions the components encode. Breaking them is what makes a
screen look off.

**Surfaces.** The page is white. A panel is white inside a hairline — no fill,
no shadow. Only things that genuinely float get a shadow: menus, the ⌘K
palette. Grey fills are not used as surfaces; grey blocks made every screen
read as a dashboard.

**Ruled ground.** The signature layout is `Lattice` — cells divided by
hairlines with a marker on every intersection. Reach for it whenever you have a
set of peers: stats, decks, promises, papers. Use `Card` when the content is
one thing, not a set.

**Colour is functional.** Green means earned, red means it costs you, amber
means partial, indigo is the accent for selection and focus. Nothing is
coloured for decoration. If a bar is only showing volume, it is `bg-ink`.

**Type.** Headings are large and light — `h1/h2/h3` default to weight 400 with
tight tracking. Weight contrast is carried by size and colour instead. There
are no uppercase, letter-spaced micro-labels anywhere.

**Hover.** Menus and interactive cells tint faintly with `brand-soft`. Bordered
controls darken their border. Text controls darken their ink. Nothing fills
grey, and nothing lifts on hover.

**Actions are pills.** Primary is black, secondary is a hairline on white,
ghost is text. One height per size, one radius.

**Scores are read against a cutoff.** Use `CutoffBar`, not a percentage bar —
in this domain the threshold is the whole story, so the track carries a notch
and the fill only turns red when it misses. `Meter` is for plain proportions.

## Motion

Two rules drive every animation in the system:

- **Colour and opacity never overshoot.** A border or fill change is a plain
  eased tween. Only a transform (scale) is allowed to spring.
- **Deselecting is faster than selecting, and runs concurrently.** Sequencing
  them reads as lag.

`.press` (a `@utility` in `theme.css`) is the default tap feedback — `scale(0.97)`
on `:active`, asymmetric: 120ms down, 200ms back up. It ships on `Button` and
`IconButton` already; add it to any other clickable element by hand.

`lib/motion.ts` holds the framer-motion equivalents (`EASE_SWIFT`,
`INDICATOR_SPRING`, `questionVariants`) so components can't drift onto
different numbers than the CSS tokens below.

**`OptionRow`** is the MCQ answer control, shared by `/mocks` and `/drills` —
don't hand-roll a second one. Border/fill tween on select; the A/B/C/D badge
stays visible always (it's a label, not a checkmark) and springs on selection,
since scale is the one transform allowed to overshoot.

**Reduced motion.** `AppProvider` wraps the app in `MotionConfig`, driven by
whichever fires first: the Settings "Reduce motion" toggle or the OS
`prefers-reduced-motion`. It also mirrors the flag onto
`<html data-reduce-motion>`, because framer-motion's own handling doesn't
reach plain CSS — that's what `.press` checks.

## Tokens

Defined in `styles/theme.css` under `@theme`, so most become real Tailwind
utilities (`bg-panel`, `text-ink-2`, `rounded-card`). Exception: the
`duration-*` tokens — Tailwind's `duration-<N>` utilities take a bare
millisecond number, not a theme lookup, so those two only work via `var()`
in raw CSS (that's how `.press` itself uses them).

| Group    | Tokens                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Ground   | `canvas` (white page), `panel` (grey — hover and recessed only), `line`, `line-2`                              |
| Ink      | `ink`, `ink-2`, `ink-3`, `ink-4`                                                                               |
| Meaning  | `ok`, `warn`, `bad`, `brand` — each with a `-soft` fill                                                        |
| Sections | `quant`, `reasoning`, `english`, `ga`, `computer`                                                              |
| Radius   | `ctl` 12, `card` 24, `xl` 28, `pill`                                                                           |
| Shadow   | `pop` — the only one. `card` and `xs` are `none` by design.                                                    |
| Motion   | `ease-soft`, `ease-swift`, `ease-decelerate`, `ease-accelerate`, `duration-press` 120ms, `duration-slow` 200ms |

Custom utilities: `tnum` (tabular figures — use on every number that changes),
`card`, `ruled` (the answer-sheet lines), `plot-in` (staggered entrance),
`press` (tap feedback — see Motion above).

**Never name a token something a legacy stylesheet also defines** —
`src/styles/tokens.css` (marketing/auth/admin pages) or
`components/layout/MarketingLayout.css`. Either loads after the theme on the
pages that use it, and a same-named token silently reverts to their value
instead of erroring. Two incidents so far: `--color-surface` did this and made
every panel render white for an afternoon (the ground token is `panel` because
of it); the obvious motion name `--ease-standard` was already claimed with a
_different_ value by those two files, so the token here is `-swift` instead.

## Adding a component

1. Add it to the right file in `components/` — a new file only for a family.
2. Export it from `index.ts`.
3. Render it in `/design` with its variants.
4. Take the class list as `className` and merge it with `cn()`, so a caller can
   always override.
