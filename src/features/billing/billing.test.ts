import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { getEntitlement } from "./entitlements.server";
import { handleWebhook } from "./webhook.server";

const MIGRATION = join(
  import.meta.dirname,
  "..",
  "..",
  "migrations",
  "0001_billing.sql",
);
const SECRET = "whsec_test_only";
const USER = randomUUID();
const T0 = new Date("2026-09-01T00:00:00Z");

/* The real billing migration in PGlite, with the Supabase auth surface it
   references stubbed. What is under test is the state machine: what grants,
   what cannot un-grant, and what a redelivery does. */
async function freshDb() {
  const client = new PGlite();
  await client.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as 'select null::uuid';
  `);
  for (const stmt of readFileSync(MIGRATION, "utf8").split(
    "--> statement-breakpoint",
  )) {
    if (stmt.trim()) await client.exec(stmt);
  }
  return { client, db: drizzle(client, { schema }) };
}

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let planId: number;

beforeAll(async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  ({ client, db } = await freshDb());
  await client.exec(`insert into auth.users (id) values ('${USER}')`);
}, 30_000);

afterAll(async () => {
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  await client.close();
});

beforeEach(async () => {
  await client.exec(
    "truncate payments, entitlements, subscriptions, payment_events, payment_plans restart identity cascade",
  );
  const [plan] = await db
    .insert(schema.paymentPlans)
    .values({
      plan: "pro",
      interval: "monthly",
      currency: "INR",
      razorpayPlanId: "plan_test",
      amountMinor: 49_900,
    })
    .returning({ id: schema.paymentPlans.id });
  planId = plan.id;
  // What the checkout route writes before Checkout opens.
  await db.insert(schema.subscriptions).values({
    userId: USER,
    razorpaySubscriptionId: "sub_1",
    planId,
    status: "created",
    updatedAt: T0,
  });
});

const unix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

type SubFields = Partial<{
  id: string;
  status: string;
  current_end: number | null;
  notes: Record<string, string>;
}>;
type PayFields = Partial<{ id: string; amount: number; status: string }>;

function signed(
  type: string,
  at: string,
  sub: SubFields = {},
  payment?: PayFields,
) {
  const rawBody = JSON.stringify({
    entity: "event",
    event: type,
    created_at: unix(at),
    payload: {
      subscription: {
        entity: {
          id: "sub_1",
          plan_id: "plan_test",
          status: "active",
          current_start: unix("2026-09-05T00:00:00Z"),
          current_end: unix("2026-10-05T00:00:00Z"),
          charge_at: null,
          notes: {},
          ...sub,
        },
      },
      ...(payment
        ? {
            payment: {
              entity: {
                id: "pay_1",
                amount: 49_900,
                currency: "INR",
                status: "captured",
                method: "card",
                created_at: unix(at),
                ...payment,
              },
            },
          }
        : {}),
    },
  });
  return {
    rawBody,
    signature: createHmac("sha256", SECRET).update(rawBody).digest("hex"),
  };
}

const deliver = (eventId: string, ...args: Parameters<typeof signed>) =>
  handleWebhook(db, { ...signed(...args), eventId });

const entitlement = (at: string) => getEntitlement(db, USER, new Date(at));
const subscription = () =>
  db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.razorpaySubscriptionId, "sub_1"))
    .then((r) => r[0]);
const count = (table: "payments" | "payment_events") =>
  client
    .query<{ n: number }>(`select count(*)::int as n from ${table}`)
    .then((r) => r.rows[0].n);

describe("webhook grants", () => {
  it("activation grants access to the end of the paid period", async () => {
    expect(
      await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z"),
    ).toBe("processed");

    expect((await subscription()).status).toBe("active");
    expect(await entitlement("2026-09-10T00:00:00Z")).toEqual({
      plan: "pro",
      active: true,
      accessUntil: "2026-10-05T00:00:00.000Z",
    });
    expect((await entitlement("2026-10-06T00:00:00Z")).active).toBe(false);
  });

  it("a redelivery is a no-op: same event id, nothing changes", async () => {
    await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z");
    expect(
      await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z"),
    ).toBe("duplicate");
    expect(await count("payment_events")).toBe(1);
  });

  it("a renewal moves access forward and records the payment once", async () => {
    await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z");
    expect(
      await deliver(
        "evt_2",
        "subscription.charged",
        "2026-10-05T00:01:00Z",
        { current_end: unix("2026-11-05T00:00:00Z") },
        { id: "pay_2" },
      ),
    ).toBe("processed");
    expect((await entitlement("2026-10-20T00:00:00Z")).accessUntil).toBe(
      "2026-11-05T00:00:00.000Z",
    );
    expect(await count("payments")).toBe(1);

    // Same payment under a fresh event id: Razorpay does this.
    await deliver(
      "evt_3",
      "subscription.charged",
      "2026-10-05T00:02:00Z",
      { current_end: unix("2026-11-05T00:00:00Z") },
      { id: "pay_2" },
    );
    expect(await count("payments")).toBe(1);
  });

  it("nothing before the first charge grants anything", async () => {
    await deliver(
      "evt_1",
      "subscription.authenticated",
      "2026-09-05T00:00:30Z",
      {
        status: "authenticated",
      },
    );
    expect((await entitlement("2026-09-10T00:00:00Z")).active).toBe(false);
  });
});

describe("webhook cannot take access back", () => {
  it("an out-of-order event older than what is stored is dropped", async () => {
    await deliver(
      "evt_1",
      "subscription.charged",
      "2026-10-05T00:01:00Z",
      { current_end: unix("2026-11-05T00:00:00Z") },
      { id: "pay_2" },
    );
    expect(
      await deliver(
        "evt_0",
        "subscription.authenticated",
        "2026-09-04T00:00:00Z",
        {
          status: "authenticated",
          current_end: unix("2026-09-30T00:00:00Z"),
        },
      ),
    ).toBe("stale");

    expect((await subscription()).status).toBe("active");
    expect((await entitlement("2026-10-20T00:00:00Z")).accessUntil).toBe(
      "2026-11-05T00:00:00.000Z",
    );
  });

  it("a cancellation keeps the paid period", async () => {
    await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z");
    expect(
      await deliver("evt_2", "subscription.cancelled", "2026-09-20T00:00:00Z", {
        status: "cancelled",
      }),
    ).toBe("processed");

    const sub = await subscription();
    expect(sub.status).toBe("cancelled");
    expect(sub.cancelledAt).not.toBeNull();
    expect(await entitlement("2026-09-25T00:00:00Z")).toMatchObject({
      active: true,
      accessUntil: "2026-10-05T00:00:00.000Z",
    });
    expect((await entitlement("2026-10-06T00:00:00Z")).active).toBe(false);
  });

  it("a halted mandate reports a period nobody paid for, and grants nothing", async () => {
    await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z");
    await deliver("evt_2", "subscription.halted", "2026-10-06T00:00:00Z", {
      status: "halted",
      current_end: unix("2026-11-05T00:00:00Z"),
    });
    expect((await entitlement("2026-10-20T00:00:00Z")).accessUntil).toBe(
      "2026-10-05T00:00:00.000Z",
    );
  });

  it("a support extension outlives a later renewal", async () => {
    await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z");
    // Support grants a year by hand; the next renewal must not shorten it.
    await db
      .update(schema.entitlements)
      .set({ accessUntil: new Date("2027-09-05T00:00:00Z") })
      .where(eq(schema.entitlements.userId, USER));
    await deliver(
      "evt_2",
      "subscription.charged",
      "2026-10-05T00:01:00Z",
      { current_end: unix("2026-11-05T00:00:00Z") },
      { id: "pay_2" },
    );
    expect((await entitlement("2027-06-01T00:00:00Z")).accessUntil).toBe(
      "2027-09-05T00:00:00.000Z",
    );
  });
});

describe("webhook refuses", () => {
  it("a bad signature, writing nothing", async () => {
    const { rawBody } = signed(
      "subscription.activated",
      "2026-09-05T00:01:00Z",
    );
    expect(
      await handleWebhook(db, {
        rawBody,
        signature: "0".repeat(64),
        eventId: "evt_x",
      }),
    ).toBe("invalid_signature");
    expect(await count("payment_events")).toBe(0);
    expect((await subscription()).status).toBe("created");
  });

  it("a subscription it has never heard of, but keeps the event", async () => {
    expect(
      await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z", {
        id: "sub_unknown",
      }),
    ).toBe("unknown_subscription");
    expect(await count("payment_events")).toBe(1);
  });

  it("unless the notes name the owner, which recovers a lost checkout row", async () => {
    expect(
      await deliver("evt_1", "subscription.activated", "2026-09-05T00:01:00Z", {
        id: "sub_recovered",
        notes: { user_id: USER },
      }),
    ).toBe("processed");
    expect((await entitlement("2026-09-10T00:00:00Z")).active).toBe(true);
  });
});

describe("getEntitlement", () => {
  it("is free with no row at all", async () => {
    expect(await getEntitlement(db, randomUUID())).toEqual({
      plan: "free",
      active: false,
      accessUntil: null,
    });
  });
});
