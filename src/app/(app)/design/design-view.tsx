"use client";

import { useState } from "react";
import {
  AudioLines,
  Check,
  FileText,
  Lock,
  MoreHorizontal,
  Pin,
  X,
} from "lucide-react";
import {
  Avatar,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  Divider,
  Dropdown,
  type DropdownOption,
  Empty,
  Field,
  IconButton,
  Input,
  Kbd,
  MenuRow,
  PageHeader,
  SectionTitle,
  Segmented,
  Select,
  Table,
  TargetBar,
  Td,
  Textarea,
  Th,
  Tr,
  ActiveCard,
  AvatarStack,
  CornerBadge,
  CornerPlus,
  Dock,
  DockButton,
  DropSlot,
  EventCard,
  EventMark,
  EventTime,
  NoteCard,
  PlanCard,
  Rationale,
  RoundAction,
  SearchField,
  StatusPill,
  Tile,
} from "@/design-system";

// The tints, not the inks — the tint is the half that fills a surface.
const TOKENS: [string, string][] = [
  ["stage", "var(--color-stage)"],
  ["canvas", "var(--color-canvas)"],
  ["frame", "var(--color-frame)"],
  ["ink", "var(--color-ink)"],
  ["ink-2", "var(--color-ink-2)"],
  ["ink-3", "var(--color-ink-3)"],
  ["ok-soft", "var(--color-ok-soft)"],
  ["warn-soft", "var(--color-warn-soft)"],
  ["bad-soft", "var(--color-bad-soft)"],
  ["info-soft", "var(--color-info-soft)"],
  ["brand-soft", "var(--color-brand-soft)"],
  ["active-soft", "var(--color-active-soft)"],
  ["ok-pale", "var(--color-ok-pale)"],
  ["warn-pale", "var(--color-warn-pale)"],
  ["info-pale", "var(--color-info-pale)"],
  ["brand-pale", "var(--color-brand-pale)"],
];

const TYPE: [string, string, string][] = [
  [
    "Page title",
    "text-[32px] font-bold leading-[1.05] tracking-[-0.03em]",
    "44 / 700",
  ],
  ["Card title", "text-[20px] font-bold tracking-[-0.03em]", "30 / 700"],
  ["Panel label", "text-[16px] font-semibold", "16 / 600"],
  ["Body", "text-[15px] leading-[1.58] text-ink-2", "15 / 400"],
  ["Meta", "text-[13px] text-ink-3", "13 / 400"],
];

type Board = "ibps-po" | "sbi-po" | "rbi-b";

const BOARDS = [
  { value: "ibps-po", label: "IBPS PO", hint: "Prelims & Mains · 12 Oct" },
  { value: "sbi-po", label: "SBI PO", hint: "Prelims & Mains · 08 Nov" },
  { value: "rbi-b", label: "RBI Grade B", hint: "Phase 1 & 2 · 23 Nov" },
] as const satisfies readonly DropdownOption<Board>[];

export function DesignView() {
  const [seg, setSeg] = useState<"One" | "Two" | "Three">("One");
  const [board, setBoard] = useState<Board>("ibps-po");
  const [checked, setChecked] = useState(true);

  return (
    <>
      <PageHeader
        title="Design system"
        sub="Every primitive in one place. Change a component here and the whole app follows — nothing on a page should reinvent these."
        actions={<StatusPill tone="brand">v1</StatusPill>}
      />

      <Section title="Colour" note="Functional only — never decorative">
        <div className="flex flex-wrap gap-3">
          {TOKENS.map(([name, value]) => (
            <div key={name} className="w-28">
              <div
                className="rounded-ctl border-line h-16 border"
                style={{ background: value }}
              />
              <p className="mt-2 text-[13px]">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Type"
        note="Headings are heavy and tight; body stays light"
      >
        <div className="grid gap-5">
          {TYPE.map(([name, cls, meta]) => (
            <div key={name} className="flex items-baseline gap-6">
              <span className="text-ink-3 w-28 shrink-0 text-[13px]">
                {name}
              </span>
              <span className={cls}>The quick brown fox</span>
              <span className="tnum text-ink-4 ml-auto text-[13px]">
                {meta}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Plan card"
        note="Title, state, and what you can do to it — the canvas is built from these"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <PlanCard
            title="Quantitative Aptitude"
            meta={
              <>
                <span>
                  Net <b className="text-ink font-semibold">23.75</b> vs 19.25
                </span>
                <span>
                  Pace <b className="text-ink font-semibold">34s</b>
                </span>
              </>
            }
            plus={<CornerPlus label="Add a topic" />}
            status={<StatusPill tone="ok">Cleared 👏</StatusPill>}
            actions={
              <>
                <RoundAction label="More">
                  <MoreHorizontal size={18} />
                </RoundAction>
                <RoundAction label="Dismiss">
                  <X size={18} />
                </RoundAction>
                <RoundAction label="Mark done" tone="dark">
                  <Check size={18} />
                </RoundAction>
              </>
            }
          >
            Simplification, number series and data interpretation under
            sectional timing.
          </PlanCard>

          <PlanCard
            title="General Awareness"
            corner={
              <CornerBadge>
                <Lock size={20} />
              </CornerBadge>
            }
            status={<StatusPill tone="soon">Upcoming ⏳</StatusPill>}
          >
            Banking awareness, RBI and SEBI updates, and the last six months of
            current affairs.
          </PlanCard>
        </div>
      </Section>

      <Section
        title="Active card"
        note="At most one per screen, or being in progress stops meaning anything"
      >
        <ActiveCard
          title="Reasoning Ability"
          resumeLabel="Resume drill"
          status={<StatusPill tone="live">🕐 Drilling 00:30</StatusPill>}
          people={[
            { id: "a", mark: "🧑🏻", tint: "#cfe3f7" },
            { id: "b", mark: "👩🏽", tint: "#f7dcc4" },
            { id: "c", mark: "🧑🏾", tint: "#f3c9d6" },
          ]}
          className="max-w-2xl"
        >
          Floor puzzles, seating arrangement and syllogism — the section that
          eats the clock.
        </ActiveCard>
      </Section>

      <Section title="Status pill" note="State, never an action">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone="ok">Cleared 👏</StatusPill>
          <StatusPill tone="bad">Missed by 4.50</StatusPill>
          <StatusPill tone="warn">Locked 🔒</StatusPill>
          <StatusPill tone="soon">Upcoming ⏳</StatusPill>
          <StatusPill tone="live">🕐 Drilling 00:30</StatusPill>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <RoundAction label="More">
            <MoreHorizontal size={18} />
          </RoundAction>
          <RoundAction label="Dismiss">
            <X size={18} />
          </RoundAction>
          <RoundAction label="Confirm" tone="dark">
            <Check size={18} />
          </RoundAction>
          <AvatarStack
            people={[
              { id: "a", mark: "🧑🏻", tint: "#cfe3f7" },
              { id: "b", mark: "👩🏽", tint: "#f7dcc4" },
            ]}
          />
        </div>
      </Section>

      <Section
        title="Figures"
        note="Tinted by meaning; the not-yet state has no fill"
      >
        <div className="grid max-w-2xl grid-cols-3 gap-4">
          <Tile value="26" label="Papers" tone="info" />
          <Tile value="2" label="Cleared" tone="ok" />
          <Tile value="23" label="Upcoming" outline />
        </div>
        <div className="mt-6 max-w-md">
          <SearchField
            placeholder="Search papers, topics and notes"
            hint="⌘K"
          />
        </div>
      </Section>

      <Section
        title="Note card"
        note="Paper, tinted by the colour the note was written in"
      >
        <div className="grid max-w-3xl gap-5 sm:grid-cols-3">
          <NoteCard
            id="n1"
            tint="yellow"
            source="Quantitative Aptitude · Simplification"
            quote="BODMAS applies left to right within a bracket"
            when="12 Mar"
          >
            Always clear the bracket before the power. Cost me two marks in the
            last sitting.
          </NoteCard>
          <NoteCard
            id="n2"
            tint="blue"
            source="English · Error spotting"
            when="9 Mar"
          >
            Subject–verb agreement with "one of the" takes the plural noun but a
            singular verb.
          </NoteCard>
          <NoteCard
            id="n3"
            tint="pink"
            source="Reasoning · Floor puzzles"
            when="6 Mar"
          >
            Draw the grid before reading the third clue, never after.
          </NoteCard>
        </div>
      </Section>

      <Section title="Event card" note="What is scheduled, and when">
        <div className="grid max-w-96 gap-0">
          <EventCard
            kind="Mock"
            when="Tu, 25.03"
            tone="info"
            mark={
              <EventMark disc>
                <FileText strokeWidth={2} />
              </EventMark>
            }
            footer={<EventTime>Start at 12:30</EventTime>}
          >
            IBPS PO Prelims 2024 under real sectional timing — 100 questions, 60
            minutes across three sections.
          </EventCard>
          <EventCard
            kind="Drill"
            when="We, 26.03"
            tone="brand"
            mark={
              <EventMark>
                <AudioLines strokeWidth={2} />
              </EventMark>
            }
          >
            Twenty questions drawn from the reasoning bank, timed like the
            section they came from.
          </EventCard>
          <EventCard
            kind="Marking"
            when="Th, 27.03"
            tone="warn"
            mark={
              <EventMark>
                <Pin className="rotate-45" strokeWidth={2} />
              </EventMark>
            }
          >
            Two descriptive answers submitted and marked. Twenty-eight of thirty
            left in this month&rsquo;s allowance.
          </EventCard>
          <DropSlot label="Drop a session here" />
        </div>
      </Section>

      <Section
        title="Onely"
        note="Machine-written text never renders like a person's"
      >
        <Rationale quota="247 of 250 left" onReport={() => undefined}>
          Eight wrong answers cost you 2.00 marks, and eight more were left
          blank. Error spotting is where you lose most — 61% accuracy against
          84% in comprehension.
        </Rationale>
      </Section>

      <Section
        title="Dock"
        note="The floating toolbar; each button a tinted disc"
      >
        <Dock>
          <DockButton label="Text" tint="#cfc2f7">
            T
          </DockButton>
          <DockButton label="Highlight" tint="#bfe0f7">
            A
          </DockButton>
          <DockButton label="Note" tint="#f7c2d4">
            ✎
          </DockButton>
          <DockButton label="Ask Onely" tint="#dcc6f7">
            ?
          </DockButton>
          <DockButton label="Add">+</DockButton>
        </Dock>
      </Section>

      <Section title="Button" note="Every action is a pill">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <ButtonLink href="/design">Link</ButtonLink>
          <IconButton label="Close">
            <X size={16} />
          </IconButton>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <SectionTitle aside="aside text">Card</SectionTitle>
            <p className="text-ink-2 text-[15px] leading-relaxed">
              White ground inside a hairline. No fill, no shadow — only menus
              and palettes lift.
            </p>
            <Divider className="my-5" />
            <p className="text-ink-3 text-[13px]">Divider above.</p>
          </Card>
          <Card tone="info">
            <p className="text-ink-2 text-[14px]">Tinted card</p>
            <p className="mt-3 text-[15px] leading-relaxed">
              A card fills with its own tint when the card is what carries the
              state.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Data">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-ink-3 mb-3 text-[13px]">StatusPill</p>
            <div className="flex flex-wrap gap-2">
              <StatusPill>Neutral</StatusPill>
              <StatusPill tone="ok">Cleared</StatusPill>
              <StatusPill tone="warn">Partial</StatusPill>
              <StatusPill tone="bad">Missed</StatusPill>
              <StatusPill tone="brand">Brand</StatusPill>
            </div>

            <p className="text-ink-3 mt-8 mb-3 text-[13px]">
              TargetBar — read against the notch, not a maximum
            </p>
            <div className="grid gap-4">
              <TargetBar value={68} target={58} />
              <TargetBar value={54} target={56} />
              <TargetBar value={null} target={62} />
            </div>
          </div>

          <div>
            <p className="text-ink-3 mb-3 text-[13px]">Avatar and Kbd</p>
            <div className="flex items-center gap-4">
              <Avatar initials="AM" />
              <Avatar initials="AM" size={32} />
              <Kbd>⌘K</Kbd>
            </div>

            <p className="text-ink-3 mt-8 mb-3 text-[13px]">Popover rows</p>
            <div className="border-line rounded-[18px] border p-1.5">
              <MenuRow
                label="Attempt map"
                hint="Accuracy against pace"
                current
              />
              <MenuRow
                label="Mocks"
                hint="Full papers under sectional timing"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Table">
        <Card pad={false}>
          <Table
            head={
              <>
                <Th>Topic</Th>
                <Th>Verdict</Th>
                <Th align="right">Accuracy</Th>
                <Th align="right">Marks / min</Th>
              </>
            }
          >
            <Tr onClick={() => undefined} active>
              <Td>Simplification</Td>
              <Td>
                <StatusPill tone="ok">Attempt first</StatusPill>
              </Td>
              <Td align="right" className="tnum">
                92%
              </Td>
              <Td align="right" className="tnum">
                2.45
              </Td>
            </Tr>
            <Tr onClick={() => undefined}>
              <Td>Puzzles &amp; Seating</Td>
              <Td>
                <StatusPill tone="bad">Skip in the exam</StatusPill>
              </Td>
              <Td align="right" className="tnum">
                66%
              </Td>
              <Td align="right" className="tnum">
                0.36
              </Td>
            </Tr>
          </Table>
        </Card>
      </Section>

      <Section title="Form">
        <Card className="max-w-2xl">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="ds-name">
              <Input id="ds-name" defaultValue="Aarav Mehta" />
            </Field>
            <Field label="Exam" htmlFor="ds-exam" hint="Sets every target">
              <Select id="ds-exam" defaultValue="IBPS PO">
                <option>IBPS PO</option>
                <option>SBI PO</option>
              </Select>
            </Field>
          </div>
          <div className="mt-5 grid gap-5">
            <Field label="Bio" htmlFor="ds-bio">
              <Textarea
                id="ds-bio"
                rows={3}
                defaultValue="Targeting IBPS PO 2026."
              />
            </Field>
            <Field
              label="Email"
              htmlFor="ds-err"
              error="That address is already in use"
            >
              <Input id="ds-err" defaultValue="taken@onelystop.app" />
            </Field>
            <Checkbox
              label="Daily digest"
              hint="One mail at 7am with what is due"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <div>
              <p className="text-ink-3 mb-3 text-[13px]">Segmented</p>
              <Segmented
                value={seg}
                options={["One", "Two", "Three"] as const}
                onChange={setSeg}
              />
            </div>
            <Dropdown
              label="Dropdown"
              value={board}
              options={BOARDS}
              onChange={setBoard}
              className="max-w-xs"
            />
          </div>
        </Card>
      </Section>

      <Section title="Empty state">
        <Card pad={false}>
          <Empty
            title="Nothing matches"
            sub="Try a different section, or clear the search."
            action={<Button variant="secondary">Clear filters</Button>}
          />
        </Card>
      </Section>
    </>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="border-line mb-6 flex items-baseline gap-4 border-b pb-3">
        <h2 className="text-[20px] tracking-[-0.02em]">{title}</h2>
        {note ? <span className="text-ink-3 text-[13px]">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}
