import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS = join(import.meta.dirname, "..", "migrations");

function sql(): string {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS, f), "utf8"))
    .join("\n");
}

const unquote = (s: string) => s.replace(/["\s]/g, "");
const roles = (s: string) => s.split(",").map(unquote).filter(Boolean);
const table = (s: string) => unquote(s).replace(/^public\./, "");

type Policy = { table: string; verb: string; role: string };

function policies(text: string): Policy[] {
  const re =
    /CREATE POLICY\s+"[^"]+"\s+ON\s+((?:"[^"]+"|[\w.]+))[\s\S]*?FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\s+TO\s+((?:"[^"]+"|\w+)(?:\s*,\s*(?:"[^"]+"|\w+))*)/gi;
  const out: Policy[] = [];
  for (const m of text.matchAll(re)) {
    for (const role of roles(m[3])) {
      out.push({ table: table(m[1]), verb: m[2].toUpperCase(), role });
    }
  }
  return out;
}

function grants(text: string): Set<string> {
  const re =
    /GRANT\s+([\w\s,]+?)\s+ON\s+((?:"[^"]+"|[\w.]+))\s+TO\s+((?:"[^"]+"|\w+)(?:\s*,\s*(?:"[^"]+"|\w+))*)/gi;
  const out = new Set<string>();
  for (const m of text.matchAll(re)) {
    const verbs = m[1].split(",").map((v) => v.trim().toUpperCase());
    for (const role of roles(m[3])) {
      for (const verb of verbs) out.add(`${table(m[2])}:${verb}:${role}`);
    }
  }
  return out;
}

describe("RLS policies", () => {
  const text = sql();

  // Without this, a parser that stops matching passes everything vacuously.
  it("parses the migrations it is meant to check", () => {
    expect(policies(text).length).toBeGreaterThan(8);
    expect(grants(text).size).toBeGreaterThan(6);
  });

  // Postgres checks GRANTs before RLS: a policy without one never runs, and the
  // policy still looks correct in review.
  it("each has a matching grant, or it never runs", () => {
    const held = grants(text);
    const missing = policies(text)
      .filter(({ table, verb, role }) => {
        if (role === "service_role") return false; // bypasses RLS entirely
        return (
          !held.has(`${table}:${verb}:${role}`) &&
          !held.has(`${table}:ALL:${role}`)
        );
      })
      .map(({ table, verb, role }) => `${table}: FOR ${verb} TO ${role}`);

    expect(missing).toEqual([]);
  });
});

// A table without RLS is readable by anyone holding the anon key, which is
// public by design. Nothing errors; the data is simply available.
describe("row level security", () => {
  const text = sql();

  const created = () => [
    ...new Set(
      [...text.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"?(\w+)"?/gi)].map(
        (m) => m[1],
      ),
    ),
  ];

  it("parses the migrations it is meant to check", () => {
    expect(created().length).toBeGreaterThan(4);
  });

  it("enables it on every table the migrations create", () => {
    const enabled = new Set(
      [
        ...text.matchAll(/ALTER TABLE "?(\w+)"?\s+ENABLE ROW LEVEL SECURITY/gi),
      ].map((m) => m[1]),
    );
    expect(created().filter((t) => !enabled.has(t))).toEqual([]);
  });
});

// Drizzle is forward-only, so every rollback is hand-written. A missing one is
// found mid-incident.
describe("rollbacks", () => {
  it("exist for every migration", () => {
    const forward = readdirSync(MIGRATIONS)
      .filter((f) => /^\d+.*\.sql$/.test(f))
      .sort();
    const back = new Set(readdirSync(join(MIGRATIONS, "rollback")));

    expect(forward.length).toBeGreaterThan(0);
    expect(forward.filter((f) => !back.has(f))).toEqual([]);
  });
});

// Git conflicts on identical paths, so two branches can each claim 0003 under
// different names and merge cleanly. Drizzle keys the journal on idx, so the
// order they then apply in depends on how the merge happened to land.
describe("migration numbering", () => {
  const forward = () =>
    readdirSync(MIGRATIONS)
      .filter((f) => /^\d+.*\.sql$/.test(f))
      .sort();

  const numberOf = (f: string) => f.slice(0, f.indexOf("_"));

  it("parses the migrations it is meant to check", () => {
    expect(forward().length).toBeGreaterThan(0);
  });

  it("gives every migration its own number", () => {
    const seen = new Map<string, string[]>();
    for (const f of forward()) {
      const n = numberOf(f);
      seen.set(n, [...(seen.get(n) ?? []), f]);
    }
    const clashes = [...seen.entries()]
      .filter(([, files]) => files.length > 1)
      .map(([n, files]) => `${n}: ${files.join(" and ")}`);

    expect(clashes).toEqual([]);
  });

  it("gives every journal entry its own idx", () => {
    const journal = JSON.parse(
      readFileSync(join(MIGRATIONS, "meta", "_journal.json"), "utf8"),
    ) as { entries: { idx: number; tag: string }[] };

    const byIdx = new Map<number, string[]>();
    for (const e of journal.entries) {
      byIdx.set(e.idx, [...(byIdx.get(e.idx) ?? []), e.tag]);
    }
    const clashes = [...byIdx.entries()]
      .filter(([, tags]) => tags.length > 1)
      .map(([idx, tags]) => `idx ${idx}: ${tags.join(" and ")}`);

    expect(journal.entries.length).toBe(forward().length);
    expect(clashes).toEqual([]);
  });
});
