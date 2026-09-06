import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS = join(import.meta.dirname, "..", "migrations");

// The only two tables supabase-js queries by name; everything else goes through drizzle.
const REACHED_BY_POSTGREST = new Set(["user_roles", "role_permissions"]);

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

// Net of both: reading only the GRANTs reports privileges a REVOKE took back.
function grants(text: string): Set<string> {
  const grant =
    /GRANT\s+([\w\s,]+?)\s+ON\s+((?:"[^"]+"|[\w.]+))\s+TO\s+((?:"[^"]+"|\w+)(?:\s*,\s*(?:"[^"]+"|\w+))*)/gi;
  const revoke =
    /REVOKE\s+([\w\s,]+?)\s+ON\s+(ALL\s+TABLES\s+IN\s+SCHEMA\s+\w+|(?:"[^"]+"|[\w.]+))\s+FROM\s+((?:"[^"]+"|\w+)(?:\s*,\s*(?:"[^"]+"|\w+))*)/gi;

  const held = new Set<string>();
  const statements = text.split(";");
  for (const stmt of statements) {
    for (const m of stmt.matchAll(grant)) {
      const verbs = m[1]!.split(",").map((v) => v.trim().toUpperCase());
      for (const role of roles(m[3]!)) {
        for (const verb of verbs) held.add(`${table(m[2]!)}:${verb}:${role}`);
      }
    }
    for (const m of stmt.matchAll(revoke)) {
      const target = m[2]!.toUpperCase();
      const all = target.startsWith("ALL TABLES");
      for (const role of roles(m[3]!)) {
        for (const g of [...held]) {
          const [t, , r] = g.split(":");
          if (r !== role) continue;
          if (all || t === table(m[2]!)) held.delete(g);
        }
      }
    }
  }
  return held;
}

// Counted before the revokes net them off, so a parser that stops matching is caught.
const grantStatements = (text: string) =>
  [...text.matchAll(/\bGRANT\s+[\w\s,]+?\s+ON\s+/gi)].length;

describe("RLS policies", () => {
  const text = sql();

  // Without this, a parser that stops matching passes everything vacuously.
  it("parses the migrations it is meant to check", () => {
    expect(policies(text).length).toBeGreaterThan(8);
    expect(grantStatements(text)).toBeGreaterThan(2);
  });

  // Postgres checks GRANTs before RLS, so an ungranted policy returns zero rows.
  it("cover what supabase-js reads, or those reads come back empty", () => {
    const held = grants(text);
    const missing = policies(text)
      .filter(({ table }) => REACHED_BY_POSTGREST.has(table))
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

// Without RLS the table is readable by anyone holding the anon key, silently.
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

// A grant wider than the policy beside it is how a client skips the route entirely.
describe("least privilege", () => {
  const text = sql();

  it("parses the migrations it is meant to check", () => {
    expect(grantStatements(text)).toBeGreaterThan(2);
    expect(grants(text).size).toBe(REACHED_BY_POSTGREST.size);
  });

  it("grants no table to anon", () => {
    const held = [...grants(text)].filter((g) => g.endsWith(":anon"));
    expect(held).toEqual([]);
  });

  it("grants authenticated only what supabase-js actually reads", () => {
    const wider = [...grants(text)]
      .filter((g) => g.endsWith(":authenticated"))
      .filter((g) => !REACHED_BY_POSTGREST.has(g.split(":")[0] as string));
    expect(wider).toEqual([]);
  });

  it("gives those two SELECT only, never a write", () => {
    const writes = [...grants(text)]
      .filter((g) => g.endsWith(":authenticated"))
      .filter((g) => (g.split(":")[1] as string) !== "SELECT");
    expect(writes).toEqual([]);
  });
});

// Drizzle is forward-only: a hand-written rollback that is missing is found mid-incident.
describe("rollbacks", () => {
  const forward = () =>
    readdirSync(MIGRATIONS)
      .filter((f) => /^\d+.*\.sql$/.test(f))
      .sort();

  it("exist for every migration", () => {
    const back = new Set(readdirSync(join(MIGRATIONS, "rollback")));

    expect(forward().length).toBeGreaterThan(0);
    expect(forward().filter((f) => !back.has(f))).toEqual([]);
  });

  // A blank file passed the check above, which is how you find one mid-incident.
  it("say something, rather than being an empty file", () => {
    const empty = forward().filter(
      (f) =>
        readFileSync(join(MIGRATIONS, "rollback", f), "utf8").trim().length <
        20,
    );
    expect(empty).toEqual([]);
  });

  // A rollback that drops a table takes the data with it, and should say so.
  it("warn when they destroy data", () => {
    const silent = forward().filter((f) => {
      const body = readFileSync(join(MIGRATIONS, "rollback", f), "utf8");
      const destroys =
        /\b(DROP\s+TABLE|DROP\s+COLUMN|DELETE\s+FROM|TRUNCATE)\b/i;
      return destroys.test(body) && !body.includes("DESTRUCTIVE");
    });
    expect(silent).toEqual([]);
  });
});

// Two branches can each claim 0003 under different names and still merge cleanly.
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
