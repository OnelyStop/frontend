import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");

/** The real auth.users shape the trigger reads, plus every migration in order. */
async function freshDb() {
  const client = new PGlite();
  await client.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text unique,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as 'select null::uuid';
  `);
  for (const f of readdirSync(MIGRATIONS)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort()) {
    const text = readFileSync(join(MIGRATIONS, f), "utf8");
    for (const stmt of text.split("--> statement-breakpoint")) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return client;
}

describe("handle_new_user", () => {
  let client: PGlite;

  beforeAll(async () => {
    client = await freshDb();
  }, 60_000);

  afterAll(() => client.close());

  async function signUp(meta: Record<string, unknown>) {
    const id = randomUUID();
    await client.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)",
      [id, `${id}@example.com`, JSON.stringify(meta)],
    );
    const { rows } = await client.query<{
      display_name: string | null;
      avatar: string | null;
      exam_board: string;
      target_year: number | null;
    }>(
      "select display_name, avatar, exam_board, target_year from public.profiles where id = $1",
      [id],
    );
    return rows[0]!;
  }

  it("carries onboarding's answers into the profile", async () => {
    const row = await signUp({
      full_name: "Aarav Mehta",
      avatar: "indigo",
      exam_board: "SBI PO",
      target_year: 2027,
    });
    expect(row).toMatchObject({
      display_name: "Aarav Mehta",
      avatar: "indigo",
      exam_board: "SBI PO",
      target_year: 2027,
    });
  });

  it("falls back to the default board when the metadata names one that does not exist", async () => {
    // user_metadata is user-writable, so a crafted board must not raise or land in the column.
    const row = await signUp({ full_name: "Ira", exam_board: "UPSC CSE" });
    expect(row.exam_board).toBe("IBPS PO");
    expect(row.target_year).toBeNull();
  });

  it("drops a target year outside the column's own range", async () => {
    const row = await signUp({ full_name: "Ravi", target_year: 1999 });
    expect(row.target_year).toBeNull();
  });

  it("drops a target year that is not a year at all", async () => {
    const row = await signUp({ full_name: "Sana", target_year: "'; drop--" });
    expect(row.target_year).toBeNull();
    expect(row.exam_board).toBe("IBPS PO");
  });

  it("still writes a profile for a signup that answered nothing", async () => {
    const row = await signUp({});
    expect(row).toMatchObject({
      display_name: null,
      avatar: null,
      exam_board: "IBPS PO",
      target_year: null,
    });
  });
});
