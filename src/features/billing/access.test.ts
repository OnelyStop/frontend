import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { getEntitlement } from "./entitlements.server";
import { limitsFor } from "./limits";

/* What a user may see is decided in one place; these are the cases that decide it. */
const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");
const USER = randomUUID();
const NOW = new Date("2026-09-09T00:00:00Z");

async function freshDb() {
  const client = new PGlite();
  await client.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text unique,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as 'select null::uuid';
  `);
  for (const f of readdirSync(MIGRATIONS)
    .filter((n) => /^\d+_.*\.sql$/.test(n))
    .sort()) {
    for (const stmt of readFileSync(join(MIGRATIONS, f), "utf8").split(
      "--> statement-breakpoint",
    )) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return { client, db: drizzle(client, { schema }) };
}

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
  ({ client, db } = await freshDb());
  await client.exec(`insert into auth.users (id) values ('${USER}')`);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await client.exec(
    "truncate entitlements, user_roles restart identity cascade",
  );
});

const grantAdmin = () =>
  client.query(
    `insert into user_roles (user_id, role) values ('${USER}', 'admin')`,
  );

const grantPaid = (plan: "pro" | "pro_plus", until: string) =>
  client.query(
    `insert into entitlements (user_id, plan, access_until, status, updated_at)
     values ('${USER}', '${plan}', '${until}', 'active', now())`,
  );

const of = () => getEntitlement(db, USER, NOW);

describe("who gets access", () => {
  it("nobody, with no role and no entitlement", async () => {
    expect(await of()).toEqual({
      plan: "free",
      active: false,
      accessUntil: null,
    });
  });

  it("an admin, on the role alone", async () => {
    await grantAdmin();
    const e = await of();
    expect([e.plan, e.active]).toEqual(["pro_plus", true]);
  });

  // The whole point of the role check: support needs every gated page to open.
  it("an admin whose paid access has expired", async () => {
    await grantAdmin();
    await grantPaid("pro", "2026-01-01T00:00:00Z");
    const e = await of();
    expect([e.plan, e.active]).toEqual(["pro_plus", true]);
  });

  it("an editor gets nothing — only admin carries access", async () => {
    await client.query(
      `insert into user_roles (user_id, role) values ('${USER}', 'editor')`,
    );
    const e = await of();
    expect([e.plan, e.active]).toEqual(["free", false]);
  });

  it("a paying user keeps the tier they bought, not the ceiling", async () => {
    await grantPaid("pro", "2026-12-01T00:00:00Z");
    expect((await of()).plan).toBe("pro");
  });

  it("expired paid access collapses to free", async () => {
    await grantPaid("pro_plus", "2026-01-01T00:00:00Z");
    const e = await of();
    expect([e.plan, e.active]).toEqual(["free", false]);
  });
});

describe("what the top plan unlocks", () => {
  // The header hides Upgrade on exactly this test, so it may not silently change.
  it("an admin resolves to the same plan a Pro+ subscriber has", async () => {
    await grantAdmin();
    const admin = await of();
    await client.exec("truncate user_roles restart identity cascade");
    await grantPaid("pro_plus", "2026-12-01T00:00:00Z");
    const paid = await of();
    expect(admin.plan).toBe(paid.plan);
  });

  it("pro_plus is uncapped where free is not", () => {
    const free = limitsFor("free");
    const top = limitsFor("pro_plus");
    expect(free.currentAffairsDays).not.toBeNull();
    expect(top.currentAffairsDays).toBeNull();
  });
});
