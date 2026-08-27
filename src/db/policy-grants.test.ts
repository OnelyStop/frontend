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
// Migrations write both "profiles" and public.profiles.
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

  // The premise: if the parser stops finding policies, every assertion below
  // passes vacuously and the check is worthless.
  it("parses the migrations it is meant to check", () => {
    expect(policies(text).length).toBeGreaterThan(8);
    expect(grants(text).size).toBeGreaterThan(6);
  });

  // Postgres checks table GRANTs before RLS, so a policy without a matching
  // grant never runs -- the query returns zero rows and reads as "this user
  // has no data" rather than as a permissions bug. It has cost this repo real
  // debugging time twice, and it is invisible in review because the policy
  // itself looks correct.
  it("each has a matching grant, or it never runs", () => {
    const held = grants(text);
    const missing = policies(text)
      .filter(({ table, verb, role }) => {
        if (role === "service_role") return false; // bypasses RLS entirely
        return !held.has(`${table}:${verb}:${role}`) && !held.has(`${table}:ALL:${role}`);
      })
      .map(({ table, verb, role }) => `${table}: FOR ${verb} TO ${role}`);

    expect(missing).toEqual([]);
  });
});

// The user's exam target and the question bank's paper tags are the same two
// strings. A target written any other way -- 'ibps' lowercase, 'Probationary
// Officer' spelled out -- joins to none of the 13,360 questions we own, and
// nothing fails loudly: the user just gets an empty question bank.
describe("exam catalogue", () => {
  const EXPECTED = [
    ["IBPS", "PO"],
    ["SBI", "Clerk"],
    ["IBPS", "RRB"],
    ["SBI", "PO"],
    ["IBPS", "Clerk"],
  ];

  it("seeds exactly the (bank, role) pairs the question bank uses", () => {
    const seed = readFileSync(join(MIGRATIONS, "0002_profiles.sql"), "utf8");
    const block = seed.slice(seed.indexOf("INSERT INTO public.exams"));
    const pairs = [...block.matchAll(/'[\w-]+',\s*'(\w+)',\s*'(\w+)'/g)].map((m) => [
      m[1],
      m[2],
    ]);

    expect(pairs).toEqual(EXPECTED);
  });
});
