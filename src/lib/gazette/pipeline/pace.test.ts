import { describe, expect, it } from "vitest";
import { createPacer, retryDelayFromMessage } from "./pace";

// A clock that only moves when the pacer sleeps, so the assertions are about
// the schedule the pacer computed, not about real time.
function fakeClock() {
  let t = 0;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      t += ms;
    },
    advance: (ms: number) => {
      t += ms;
    },
    sleeps,
  };
}

describe("createPacer", () => {
  it("spaces starts by 60s / rpm", async () => {
    const c = fakeClock();
    const p = createPacer(12, c);
    await p.next();
    await p.next();
    await p.next();
    expect(c.sleeps).toEqual([5000, 5000]);
    expect(c.now()).toBe(10_000);
  });

  it("does not wait when the interval has already passed", async () => {
    const c = fakeClock();
    const p = createPacer(12, c);
    await p.next();
    c.advance(9000);
    await p.next();
    expect(c.sleeps).toEqual([]);
  });

  it("gives concurrent callers distinct slots", async () => {
    const c = fakeClock();
    const p = createPacer(60, c);
    await Promise.all([p.next(), p.next(), p.next()]);
    expect(c.sleeps).toEqual([1000, 1000]);
    expect(c.now()).toBe(2000);
  });

  it("delay pushes the next slot out past a provider back-off", async () => {
    const c = fakeClock();
    const p = createPacer(60, c);
    await p.next();
    p.delay(5000);
    await p.next();
    expect(c.sleeps).toEqual([5000]);
  });
});

describe("retryDelayFromMessage", () => {
  it("reads the shapes providers actually send", () => {
    expect(retryDelayFromMessage('{"retryDelay":"30s"}')).toBe(30_000);
    expect(retryDelayFromMessage("Retry-After: 5000")).toBe(5000);
    expect(retryDelayFromMessage("Please retry in 12.5s.")).toBe(12_500);
    expect(retryDelayFromMessage("retry after 250ms")).toBe(250);
  });

  it("returns null when there is nothing to honour", () => {
    expect(retryDelayFromMessage("503 Service Unavailable")).toBeNull();
    expect(retryDelayFromMessage("please retry")).toBeNull();
  });
});
