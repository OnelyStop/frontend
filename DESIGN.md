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
  components/
    button.tsx             Button, ButtonLink, IconButton
    surface.tsx            Card, DarkPanel, Lattice, LatticeCell, Popover, MenuRow
    form.tsx               Field, Input, Textarea, Select, Checkbox, Segmented
    data.tsx               Badge, Stat, Meter, CutoffBar, Avatar, Kbd, Table
    page.tsx               PageHeader, SectionTitle, Empty, Divider
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

## Tokens

Defined in `styles/theme.css` under `@theme`, so every one is a real Tailwind
utility (`bg-panel`, `text-ink-2`, `rounded-card`).

| Group | Tokens |
|---|---|
| Ground | `canvas` (white page), `panel` (grey — hover and recessed only), `line`, `line-2` |
| Ink | `ink`, `ink-2`, `ink-3`, `ink-4` |
| Meaning | `ok`, `warn`, `bad`, `brand` — each with a `-soft` fill |
| Sections | `quant`, `reasoning`, `english`, `ga`, `computer` |
| Radius | `ctl` 12, `card` 24, `xl` 28, `pill` |
| Shadow | `pop` — the only one. `card` and `xs` are `none` by design. |

Custom utilities: `tnum` (tabular figures — use on every number that changes),
`card`, `ruled` (the answer-sheet lines), `plot-in` (staggered entrance).

**Never name a token something the legacy `src/styles/tokens.css` also
defines.** It loads after the theme on marketing pages, and a collision
silently reverts the value — `--color-surface` did exactly this and made every
panel render white for an afternoon. That is why the ground token is `panel`.

## Adding a component

1. Add it to the right file in `components/` — a new file only for a family.
2. Export it from `index.ts`.
3. Render it in `/design` with its variants.
4. Take the class list as `className` and merge it with `cn()`, so a caller can
   always override.
