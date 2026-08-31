import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  verifySubscriptionSignature,
  verifyWebhookSignature,
} from "./razorpay.server";

const KEY_SECRET = "test_key_secret";
const WEBHOOK_SECRET = "test_webhook_secret";

const sign = (secret: string, message: string) =>
  createHmac("sha256", secret).update(message).digest("hex");

beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

afterEach(() => {
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

describe("subscription callback signature", () => {
  const paymentId = "pay_29QQoUBi66xm2f";
  const subscriptionId = "sub_00000000000001";

  it("accepts payment_id|subscription_id", () => {
    const signature = sign(KEY_SECRET, `${paymentId}|${subscriptionId}`);
    expect(
      verifySubscriptionSignature({ paymentId, subscriptionId, signature }),
    ).toBe(true);
  });

  // The whole point of this file. One-off orders hash order_id|payment_id, and
  // reusing that order here fails as "invalid signature", which reads like a
  // wrong key rather than a wrong formula.
  it("rejects the order-style order, subscription_id|payment_id", () => {
    const signature = sign(KEY_SECRET, `${subscriptionId}|${paymentId}`);
    expect(
      verifySubscriptionSignature({ paymentId, subscriptionId, signature }),
    ).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    const signature = sign(
      "someone_elses_secret",
      `${paymentId}|${subscriptionId}`,
    );
    expect(
      verifySubscriptionSignature({ paymentId, subscriptionId, signature }),
    ).toBe(false);
  });

  // timingSafeEqual throws when the buffers differ in length, so a short or
  // empty signature has to be rejected rather than crash the route.
  it("rejects a wrong-length signature without throwing", () => {
    for (const signature of ["", "abc", "0".repeat(63), "0".repeat(65)]) {
      expect(() =>
        verifySubscriptionSignature({ paymentId, subscriptionId, signature }),
      ).not.toThrow();
      expect(
        verifySubscriptionSignature({ paymentId, subscriptionId, signature }),
      ).toBe(false);
    }
  });
});

describe("webhook signature", () => {
  // Whitespace on purpose. Razorpay does not promise minified JSON, and a body
  // that happens to round-trip byte-identically would make the test below prove
  // nothing -- which is what the first version of it did.
  const rawBody = '{ "event": "subscription.charged", "payload": { "a": 1 } }';

  it("accepts a signature over the raw body", () => {
    expect(verifyWebhookSignature(rawBody, sign(WEBHOOK_SECRET, rawBody))).toBe(
      true,
    );
  });

  // Parsing and re-serialising changes key order and whitespace, so the hash no
  // longer matches. This is the reason the route must read request.text() and
  // hash that, never JSON.stringify(await request.json()).
  it("rejects a signature over re-serialised JSON", () => {
    const reserialised = JSON.stringify(JSON.parse(rawBody));
    const signature = sign(WEBHOOK_SECRET, rawBody);
    // Guard the premise: if these were byte-identical the test would prove
    // nothing.
    expect(reserialised).not.toBe(rawBody);
    expect(verifyWebhookSignature(reserialised, signature)).toBe(false);
  });

  it("rejects the key secret used in place of the webhook secret", () => {
    expect(verifyWebhookSignature(rawBody, sign(KEY_SECRET, rawBody))).toBe(
      false,
    );
  });

  it("throws when the webhook secret is missing, rather than accepting", () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect(() => verifyWebhookSignature(rawBody, "whatever")).toThrow(
      /RAZORPAY_WEBHOOK_SECRET/,
    );
  });
});
