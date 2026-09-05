import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { profiles } from "@/db/schema";
import { EXAMS, SECTIONS } from "@/data/navigation";
import { deleteAccount } from "./mutations.server";
import { accountClose, profileUpdate } from "./types";

/* The request validator builds its enums from the navigation constants so the
   client bundle stays free of drizzle. That leaves two lists to drift apart,
   and a drift is invisible until a save fails at the database rather than the
   validator — so assert they are the same list. */
describe("profile enums track the database", () => {
  it("exam boards match", () => {
    expect([...profiles.examBoard.enumValues]).toEqual([...EXAMS]);
  });

  it("sections match", () => {
    expect([...profiles.defaultSection.enumValues]).toEqual([...SECTIONS]);
  });
});

describe("profileUpdate", () => {
  it("rejects a field it does not own", () => {
    const result = profileUpdate.safeParse({ id: "someone-else" });
    expect(result.success).toBe(false);
  });

  it("rejects a target year outside the check constraint", () => {
    expect(profileUpdate.safeParse({ targetYear: 1999 }).success).toBe(false);
    expect(profileUpdate.safeParse({ targetYear: 2101 }).success).toBe(false);
    expect(profileUpdate.safeParse({ targetYear: 2026 }).success).toBe(true);
  });

  it("rejects an exam board that is not in the enum", () => {
    expect(profileUpdate.safeParse({ examBoard: "IBPS SO" }).success).toBe(
      false,
    );
  });

  it("accepts an empty patch so the route can reject it by name", () => {
    expect(profileUpdate.safeParse({}).success).toBe(true);
  });
});

describe("accountClose", () => {
  it("requires confirmEmail", () => {
    expect(accountClose.safeParse({}).success).toBe(false);
  });

  it("rejects a value that is not an email", () => {
    expect(
      accountClose.safeParse({ confirmEmail: "not-an-email" }).success,
    ).toBe(false);
  });

  it("trims, so a pasted trailing space is not a mismatch", () => {
    expect(accountClose.parse({ confirmEmail: " Me@Example.com " })).toEqual({
      confirmEmail: "Me@Example.com",
    });
  });
});

const MIGRATIONS = join(import.meta.dirname, "..", "..", "migrations");

/* Every migration, in order, in PGlite, with the Supabase auth surface they
   reference stubbed to the columns they touch. Closing an account is nothing
   but the cascades those migrations declare, so a hand-built subset would
   test the subset and not the promise. */
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
  const files = readdirSync(MIGRATIONS)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();
  for (const f of files) {
    const text = readFileSync(join(MIGRATIONS, f), "utf8");
    for (const stmt of text.split("--> statement-breakpoint")) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return { client, db: drizzle(client, { schema }) };
}

describe("deleteAccount", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(async () => {
    ({ client, db } = await freshDb());
  }, 30_000);

  afterAll(() => client.close());

  const count = (table: string, column: string, id: string) =>
    client
      .query<{ n: number }>(
        `select count(*)::int as n from ${table} where ${column} = $1`,
        [id],
      )
      .then((r) => r.rows[0].n);

  const remaining = async (userId: string) => ({
    users: await count("auth.users", "id", userId),
    profiles: await count("profiles", "id", userId),
    entitlements: await count("entitlements", "user_id", userId),
    doubts: await count("doubts", "author_id", userId),
  });

  async function signUp(email: string) {
    const userId = randomUUID();
    await client.query("insert into auth.users (id, email) values ($1, $2)", [
      userId,
      email,
    ]);
    // The signup trigger from 0002 makes the profile; the upsert covers a
    // database where it has not fired.
    await db
      .insert(schema.profiles)
      .values({ id: userId })
      .onConflictDoNothing();
    await db.insert(schema.entitlements).values({
      userId,
      plan: "pro",
      accessUntil: new Date("2027-01-01T00:00:00Z"),
      status: "active",
    });
    await db.insert(schema.doubts).values({
      authorId: userId,
      section: "Reasoning Ability",
      topic: "Puzzles",
      title: "Floor puzzle with two variables",
      body: "How do I place the people when two of the clues contradict?",
    });
    return userId;
  }

  it("closing the account removes the user and everything hanging off it", async () => {
    const userId = await signUp("leaving@example.com");
    expect(await remaining(userId)).toEqual({
      users: 1,
      profiles: 1,
      entitlements: 1,
      doubts: 1,
    });

    expect(await deleteAccount(db, userId)).toEqual({ deleted: true });

    expect(await remaining(userId)).toEqual({
      users: 0,
      profiles: 0,
      entitlements: 0,
      doubts: 0,
    });
  });

  it("leaves every other account alone", async () => {
    const leaving = await signUp("one@example.com");
    const staying = await signUp("two@example.com");

    await deleteAccount(db, leaving);

    expect(await remaining(staying)).toEqual({
      users: 1,
      profiles: 1,
      entitlements: 1,
      doubts: 1,
    });
  });

  it("a second close reports nothing deleted", async () => {
    const userId = await signUp("twice@example.com");
    await deleteAccount(db, userId);
    expect(await deleteAccount(db, userId)).toEqual({ deleted: false });
  });
});
