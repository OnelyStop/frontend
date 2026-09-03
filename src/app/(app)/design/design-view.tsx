"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  CutoffBar,
  DarkPanel,
  Divider,
  Dropdown,
  type DropdownOption,
  Empty,
  Field,
  IconButton,
  Input,
  Kbd,
  Lattice,
  LatticeCell,
  MenuRow,
  Meter,
  PageHeader,
  SectionTitle,
  Segmented,
  Select,
  Stat,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/design-system";

/* The living style guide. Every component in the system renders here, so a
   change to a primitive is visible in one place before it ships to a page. */

const TOKENS: [string, string][] = [
  ["canvas", "var(--color-canvas)"],
  ["panel", "var(--color-panel)"],
  ["line", "var(--color-line)"],
  ["ink", "var(--color-ink)"],
  ["ink-2", "var(--color-ink-2)"],
  ["ink-3", "var(--color-ink-3)"],
  ["brand", "var(--color-brand)"],
  ["ok", "var(--color-ok)"],
  ["warn", "var(--color-warn)"],
  ["bad", "var(--color-bad)"],
];

const TYPE: [string, string, string][] = [
  ["Page title", "text-[48px] leading-[1.05] tracking-[-0.03em]", "48 / 400"],
  ["Card title", "text-[24px] tracking-[-0.02em]", "24 / 400"],
  ["Panel label", "text-[16px] font-medium", "16 / 500"],
  ["Body", "text-[15px] leading-[1.55] text-ink-2", "15 / 400"],
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
        actions={<Badge tone="brand">v1</Badge>}
      />

      <Section title="Colour" note="Functional only — never decorative">
        <div className="flex flex-wrap gap-3">
          {TOKENS.map(([name, value]) => (
            <div key={name} className="w-[112px]">
              <div
                className="rounded-ctl border-line h-16 border"
                style={{ background: value }}
              />
              <p className="mt-2 text-[13px]">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type" note="Headings are light; weight contrast is size">
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

      <Section
        title="Lattice"
        note="The signature layout — ruled ground, not objects"
      >
        <Lattice cols={4}>
          <LatticeCell>
            <Stat
              label="Marks per minute"
              value="1.97"
              note="1.26 if you attempt everything"
            />
          </LatticeCell>
          <LatticeCell>
            <Stat label="Bankable topics" value="9" note="fast and accurate" />
          </LatticeCell>
          <LatticeCell>
            <Stat label="On your skip list" value="8" note="slow and wrong" />
          </LatticeCell>
          <LatticeCell onClick={() => undefined}>
            <Stat label="Median pace" value="38s" note="clickable cell" />
          </LatticeCell>
        </Lattice>
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
          <DarkPanel>
            <p className="text-[14px] text-white/50">DarkPanel</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85">
              One dark object per screen at most — the payoff, or the thing you
              cannot miss.
            </p>
          </DarkPanel>
        </div>
      </Section>

      <Section title="Data">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-ink-3 mb-3 text-[13px]">Badge</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="ok">Cleared</Badge>
              <Badge tone="warn">Partial</Badge>
              <Badge tone="bad">Missed</Badge>
              <Badge tone="brand">Brand</Badge>
            </div>

            <p className="text-ink-3 mt-8 mb-3 text-[13px]">
              CutoffBar — read against the notch, not a maximum
            </p>
            <div className="grid gap-4">
              <CutoffBar value={68} cutoff={58} />
              <CutoffBar value={54} cutoff={56} />
              <CutoffBar value={null} cutoff={62} />
            </div>

            <p className="text-ink-3 mt-8 mb-3 text-[13px]">Meter</p>
            <Meter value={71} />
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
                <Badge tone="ok">Attempt first</Badge>
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
                <Badge tone="bad">Skip in the exam</Badge>
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
            <Field label="Exam" htmlFor="ds-exam" hint="Sets every cutoff">
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
